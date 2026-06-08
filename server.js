import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'
import { buildMeditationPrompt } from './src/data/meditationPrompt.js'
import { ELEVENLABS_VOICE_SETTINGS } from './src/config/elevenlabsVoiceSettings.js'
import { cleanMeditationScript, scriptToLines } from './src/utils/meditationScript.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const app = express()
const upload = multer({ storage: multer.memoryStorage() })
const PORT = 3001

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MEDITATION_MODEL = 'claude-sonnet-4-6'
const MEDITATION_MAX_TOKENS_BY_MINUTES = { 5: 1000, 10: 1850, 15: 3100 }
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_TTS_MODEL = 'eleven_multilingual_v2'
const ELEVENLABS_TTS_TIMEOUT_MS = 120_000

const TTS_CONCURRENCY = 2

// ---------------------------------------------------------------------------
// Silent MP3 frames
//
// A valid MPEG-1 Layer 3 frame at 128 kbps / 44100 Hz / mono / no CRC:
//   Header (4 bytes): FF FB 90 C0
//   Side info (17 bytes): all zeros  →  part2_3_length=0 means no Huffman data
//   Main data (396 bytes): all zeros
//   Total frame: 417 bytes, duration: 1152 / 44100 ≈ 26 ms
//
// 77 of these frames = exactly 2 seconds of silence.
// ---------------------------------------------------------------------------
const SILENT_FRAME = Buffer.concat([
  Buffer.from([0xFF, 0xFB, 0x90, 0xC0]),
  Buffer.alloc(17, 0),
  Buffer.alloc(396, 0),
])
const SILENCE_MP3 = Buffer.concat(Array.from({ length: 77 }, () => SILENT_FRAME))

app.use(cors())
app.use(express.json({ limit: '10mb' }))

function parseApiError(message) {
  try {
    const parsed = JSON.parse(message)
    if (parsed.detail?.message) return parsed.detail.message
    return parsed.error?.message || parsed.message || message
  } catch {
    return message
  }
}

function getAnthropicKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY in .env')
  return apiKey
}

function getElevenLabsKey() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY in .env')
  return apiKey
}

/**
 * Strip the ID3v2 tag and the Xing/Info VBR header frame from an MP3 buffer.
 * Without the Xing frame, the browser has no declared file length and plays
 * through concatenated chunks without stopping early.
 */
function stripVbrHeader(mp3) {
  let pos = 0

  // Skip ID3v2 tag (synchsafe integer size in bytes 6–9)
  if (mp3.length >= 10 && mp3.slice(0, 3).toString('ascii') === 'ID3') {
    const id3Size =
      ((mp3[6] & 0x7F) << 21) |
      ((mp3[7] & 0x7F) << 14) |
      ((mp3[8] & 0x7F) << 7) |
      (mp3[9] & 0x7F)
    pos = 10 + id3Size
  }

  // Find first MPEG sync frame
  let frameStart = -1
  for (let i = pos; i < mp3.length - 3; i++) {
    if (mp3[i] === 0xFF && (mp3[i + 1] & 0xE0) === 0xE0) {
      frameStart = i
      break
    }
  }
  if (frameStart < 0) return mp3.slice(pos)

  // Calculate frame size
  const bitrateIdx = (mp3[frameStart + 2] >> 4) & 0xF
  const srateIdx   = (mp3[frameStart + 2] >> 2) & 0x3
  const padding    = (mp3[frameStart + 2] >> 1) & 0x1
  const bitratesKbps = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0]
  const srates = [44100, 48000, 32000, 0]
  const bitrate = bitratesKbps[bitrateIdx] * 1000
  const srate   = srates[srateIdx]
  if (!bitrate || !srate) return mp3.slice(frameStart)
  const frameSize = Math.floor(144 * bitrate / srate) + padding

  // Check for Xing/Info marker inside this frame
  // No-CRC mono MPEG-1 L3: header=4 bytes + side_info=17 bytes → marker at +21
  // No-CRC stereo:         header=4 bytes + side_info=32 bytes → marker at +36
  const isMono = ((mp3[frameStart + 3] >> 6) & 0x3) === 3
  const markerOffset = frameStart + 4 + (isMono ? 17 : 32)

  if (markerOffset + 4 <= mp3.length) {
    const marker = mp3.slice(markerOffset, markerOffset + 4).toString('ascii')
    if (marker === 'Xing' || marker === 'Info') {
      return mp3.slice(frameStart + frameSize)
    }
  }

  return mp3.slice(frameStart)
}

/** Fetch an MP3 from ElevenLabs for a single line of text. */
async function callElevenLabsTts(voiceId, text) {
  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': getElevenLabsKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_TTS_MODEL,
        output_format: 'mp3_44100_128',
        apply_text_normalization: 'on',
        voice_settings: { ...ELEVENLABS_VOICE_SETTINGS },
      }),
      signal: AbortSignal.timeout(ELEVENLABS_TTS_TIMEOUT_MS),
    },
  )

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(
      parseApiError(message) || `ElevenLabs request failed (${response.status})`,
    )
  }

  return Buffer.from(await response.arrayBuffer())
}

/**
 * Fetch one MP3 per spoken line (up to TTS_CONCURRENCY in parallel),
 * strip the Xing/VBR header from each, then interleave 2-second silent
 * MP3 frames so the browser plays them as one continuous stream.
 */
async function generateStitchedAudio(voiceId, script) {
  const lines = scriptToLines(script)
  console.log(`[generate-audio] ${lines.length} lines to synthesise`)

  const mp3Chunks = new Array(lines.length).fill(null)
  let ptr = 0

  async function worker() {
    while (ptr < lines.length) {
      const i = ptr++
      console.log(`[generate-audio] line ${i + 1}/${lines.length}: "${lines[i]}"`)
      const raw = await callElevenLabsTts(voiceId, lines[i])
      mp3Chunks[i] = stripVbrHeader(raw)
    }
  }

  await Promise.all(Array.from({ length: TTS_CONCURRENCY }, worker))

  const parts = []
  for (const chunk of mp3Chunks) {
    if (chunk && chunk.length > 0) {
      parts.push(chunk)
      parts.push(SILENCE_MP3)
    }
  }

  return Buffer.concat(parts)
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    elevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
  })
})

app.post('/api/generate-meditation', async (req, res) => {
  try {
    const { theme, situation, length } = req.body

    if (!theme || !length) {
      return res.status(400).json({ error: 'theme and length are required.' })
    }

    const prompt = buildMeditationPrompt({
      theme,
      context: situation ?? '',
      length,
    })

    const lengthMinutes = parseInt(length, 10) || 10
    const maxTokens = MEDITATION_MAX_TOKENS_BY_MINUTES[lengthMinutes] ?? 1800

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getAnthropicKey(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MEDITATION_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText)
      return res.status(response.status).json({
        error: parseApiError(message) || `Claude request failed (${response.status})`,
      })
    }

    const data = await response.json()
    const text = data.content?.find((block) => block.type === 'text')?.text

    if (!text?.trim()) {
      return res.status(500).json({ error: 'Claude returned an empty meditation script.' })
    }

    return res.json({ script: cleanMeditationScript(text.trim()) })
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate meditation.',
    })
  }
})

app.post('/api/generate-audio', async (req, res) => {
  try {
    const { script, voice_id: voiceId } = req.body

    if (!script?.trim() || !voiceId) {
      return res.status(400).json({ error: 'script and voice_id are required.' })
    }

    const mp3Buffer = await generateStitchedAudio(voiceId, script)
    console.log(`[generate-audio] Done — ${mp3Buffer.length} bytes`)

    res.set('Content-Type', 'audio/mpeg')
    return res.send(mp3Buffer)
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return res.status(504).json({
        error: 'ElevenLabs took longer than 120 seconds. Please try again.',
      })
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate audio.',
    })
  }
})

app.post('/api/clone-voice', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required.' })
    }

    const formData = new FormData()
    formData.append('name', `Tune-Up Voice ${Date.now()}`)
    formData.append('description', 'Personal voice profile created in Tune-Up')
    formData.append(
      'files',
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname || 'recording.webm',
    )

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': getElevenLabsKey() },
      body: formData,
    })

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText)
      return res.status(response.status).json({
        error: parseApiError(message) || `Voice clone failed (${response.status})`,
      })
    }

    const data = await response.json()
    const voiceId = data.voice_id ?? data.voiceId

    if (!voiceId) {
      return res.status(500).json({
        error: 'Voice clone succeeded but no voice ID was returned.',
      })
    }

    return res.json({ voice_id: voiceId })
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to clone voice.',
    })
  }
})

const server = app.listen(PORT, () => {
  console.log(`Tune-Up API server running on http://localhost:${PORT}`)
  console.log(
    `API keys loaded — Anthropic: ${process.env.ANTHROPIC_API_KEY ? 'yes' : 'no'}, ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? 'yes' : 'no'}`,
  )
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process and run npm run dev again.`)
    process.exit(1)
  }
  console.error('Server failed to start:', error)
  process.exit(1)
})
