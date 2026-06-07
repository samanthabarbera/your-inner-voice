import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'
import { buildMeditationPrompt } from './src/data/meditationPrompt.js'
import { ELEVENLABS_VOICE_SETTINGS } from './src/config/elevenlabsVoiceSettings.js'
import {
  cleanMeditationScript,
  prepareScriptForSpeech,
} from './src/utils/meditationScript.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const app = express()
const upload = multer({ storage: multer.memoryStorage() })
const PORT = 3001

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MEDITATION_MODEL = 'claude-sonnet-4-6'
const MEDITATION_MAX_TOKENS = 4000
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_TTS_MODEL = 'eleven_multilingual_v2'
const ELEVENLABS_TTS_TIMEOUT_MS = 120_000

// Silent MP3 frame constants: MPEG1 Layer3, 128 kbps, 44100 Hz, stereo, original
const MP3_SAMPLES_PER_FRAME = 1152
const MP3_SAMPLE_RATE = 44100
const MP3_FRAME_SIZE_BYTES = 417 // floor(144 * 128000 / 44100), no padding
const SILENT_MP3_FRAME_HEADER = Buffer.from([0xff, 0xfb, 0x90, 0x64])

const TEST_AUDIO_SCRIPT =
  'Close your eyes. <break time="3s"/> Take a breath in. <break time="3s"/> And let it go.'
const TEST_AUDIO_VOICE_ID = 'UmQN7jS1Ee8B1czsUtQh'

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
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY in .env')
  }
  return apiKey
}

function getElevenLabsKey() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('Missing ELEVENLABS_API_KEY in .env')
  }
  return apiKey
}

/** Builds the exact JSON body sent to ElevenLabs text-to-speech. */
function buildElevenLabsTtsPayload(text) {
  return {
    text,
    model_id: ELEVENLABS_TTS_MODEL,
    apply_text_normalization: 'on',
    voice_settings: { ...ELEVENLABS_VOICE_SETTINGS },
  }
}

/** Generates a Buffer of silent MP3 frames for the given duration in milliseconds. */
function generateSilentMp3(durationMs) {
  const frameDurationMs = (MP3_SAMPLES_PER_FRAME / MP3_SAMPLE_RATE) * 1000
  const numFrames = Math.max(1, Math.ceil(durationMs / frameDurationMs))
  const silentFrame = Buffer.alloc(MP3_FRAME_SIZE_BYTES)
  SILENT_MP3_FRAME_HEADER.copy(silentFrame, 0)
  return Buffer.concat(Array.from({ length: numFrames }, () => silentFrame))
}

/**
 * Splits a prepared speech script into alternating text and silence chunks.
 * Break tags are extracted as silence durations; everything else is text.
 */
function parseScriptIntoChunks(script) {
  const BREAK_PATTERN = /<break\s+time="(\d+(?:\.\d+)?)s"\s*\/>/gi
  const chunks = []
  let lastIndex = 0
  let match

  while ((match = BREAK_PATTERN.exec(script)) !== null) {
    const textBefore = script.slice(lastIndex, match.index).trim()
    if (textBefore) chunks.push({ type: 'text', content: textBefore })
    chunks.push({ type: 'silence', durationMs: parseFloat(match[1]) * 1000 })
    lastIndex = match.index + match[0].length
  }

  const remaining = script.slice(lastIndex).trim()
  if (remaining) chunks.push({ type: 'text', content: remaining })

  return chunks
}

/** Joins multi-line text into a single TTS-ready string. */
function formatTextForTts(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => (line.endsWith('.') ? line : `${line}.`))
    .join(' ')
}

/**
 * Generates stitched audio by splitting the script at break tags,
 * making a separate TTS call per text segment, and inserting real
 * silent MP3 frames for each pause.
 */
async function generateStitchedAudio(voiceId, script) {
  const chunks = parseScriptIntoChunks(script)
  const buffers = []

  for (const chunk of chunks) {
    if (chunk.type === 'text') {
      const formatted = formatTextForTts(chunk.content)
      if (formatted) {
        buffers.push(await callElevenLabsTts(voiceId, formatted))
      }
    } else {
      buffers.push(generateSilentMp3(chunk.durationMs))
    }
  }

  return Buffer.concat(buffers)
}

async function callElevenLabsTts(voiceId, text) {
  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': getElevenLabsKey(),
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(buildElevenLabsTtsPayload(text)),
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

/** Returns the ElevenLabs request details for debugging (no API key). */
function getElevenLabsTtsRequestDetails(voiceId, text) {
  return {
    method: 'POST',
    url: `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
    headers: {
      'xi-api-key': '[REDACTED]',
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: buildElevenLabsTtsPayload(text),
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    elevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
  })
})

app.get('/api/elevenlabs-tts-debug', (_req, res) => {
  res.json({
    model_id: ELEVENLABS_TTS_MODEL,
    audio_pipeline: {
      approach: 'stitching',
      description:
        'Script is split at <break> tags. Each text segment gets its own TTS call; pauses are real silent MP3 frames concatenated into a single audio file.',
      silent_mp3_frame: {
        header_hex: SILENT_MP3_FRAME_HEADER.toString('hex'),
        frame_size_bytes: MP3_FRAME_SIZE_BYTES,
        frame_duration_ms: (MP3_SAMPLES_PER_FRAME / MP3_SAMPLE_RATE) * 1000,
        spec: 'MPEG1 Layer3, 128 kbps, 44100 Hz, stereo, original',
      },
      apply_text_normalization: 'always on (no SSML in TTS calls)',
      max_break_duration: 'Break tags above 8 seconds are clamped before parsing.',
    },
    test_script: TEST_AUDIO_SCRIPT,
    test_voice_id: TEST_AUDIO_VOICE_ID,
    request: getElevenLabsTtsRequestDetails(
      TEST_AUDIO_VOICE_ID,
      TEST_AUDIO_SCRIPT,
    ),
  })
})

app.get('/api/test-audio', async (_req, res) => {
  try {
    const audioBuffer = await callElevenLabsTts(
      TEST_AUDIO_VOICE_ID,
      TEST_AUDIO_SCRIPT,
    )

    res.set({
      'Content-Type': 'audio/mpeg',
      'X-TTS-Model': ELEVENLABS_TTS_MODEL,
      'X-TTS-Voice-Id': TEST_AUDIO_VOICE_ID,
    })
    return res.send(audioBuffer)
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Test audio failed.',
      model_id: ELEVENLABS_TTS_MODEL,
      request: getElevenLabsTtsRequestDetails(
        TEST_AUDIO_VOICE_ID,
        TEST_AUDIO_SCRIPT,
      ),
    })
  }
})

app.post('/api/generate-meditation', async (req, res) => {
  try {
    const { theme, situation, length } = req.body

    if (!theme || !length) {
      return res.status(400).json({
        error: 'theme and length are required.',
      })
    }

    const prompt = buildMeditationPrompt({
      theme,
      context: situation ?? '',
      length,
    })

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getAnthropicKey(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MEDITATION_MODEL,
        max_tokens: MEDITATION_MAX_TOKENS,
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
      return res.status(500).json({
        error: 'Claude returned an empty meditation script.',
      })
    }

    const rawScript = text.trim()
    console.log('[generate-meditation] Raw script from Claude:', rawScript)

    return res.json({ script: cleanMeditationScript(rawScript) })
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
      return res.status(400).json({
        error: 'script and voice_id are required.',
      })
    }

    console.log(
      '[generate-audio] Script received (first 500 chars):',
      script.slice(0, 500),
    )

    const speechScript = prepareScriptForSpeech(script)
    const chunks = parseScriptIntoChunks(speechScript)

    console.log(
      '[generate-audio] Script parsed into',
      chunks.length,
      'chunks:',
      chunks.map((c) =>
        c.type === 'silence'
          ? `silence(${c.durationMs}ms)`
          : `text(${c.content.length} chars)`,
      ),
    )

    const audioBuffer = await generateStitchedAudio(voiceId, speechScript)

    res.set('Content-Type', 'audio/mpeg')
    return res.send(audioBuffer)
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
    formData.append(
      'description',
      'Personal voice profile created in Tune-Up',
    )
    formData.append(
      'files',
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname || 'recording.webm',
    )

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': getElevenLabsKey(),
      },
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
    console.error(
      `Port ${PORT} is already in use. Stop the other process and run npm run dev again.`,
    )
    process.exit(1)
  }

  console.error('Server failed to start:', error)
  process.exit(1)
})
