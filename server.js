import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { writeFile, readFile, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'
import Ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import { buildMeditationPrompt } from './src/data/meditationPrompt.js'
import { ELEVENLABS_VOICE_SETTINGS } from './src/config/elevenlabsVoiceSettings.js'
import { VOICES } from './src/data/builderOptions.js'
import { cleanMeditationScript, scriptToLines, scriptToChunks } from './src/utils/meditationScript.js'
import { createPacer, mp3Seconds } from './src/utils/pacing.js'
import { getTargetWordCount, buildRevisionPrompt, checkScript } from './src/data/meditationPrompt.js'

Ffmpeg.setFfmpegPath(ffmpegPath)

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const app = express()
const upload = multer({ storage: multer.memoryStorage() })
const PORT = process.env.PORT ?? 3001

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MEDITATION_MODEL = 'claude-sonnet-4-6'
const MEDITATION_MAX_TOKENS_BY_MINUTES = { 5: 1000, 10: 1850, 15: 3100 }
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_TTS_MODEL = 'eleven_multilingual_v2'
const ELEVENLABS_TTS_TIMEOUT_MS = 120_000

const TTS_CONCURRENCY = 4
/** Seconds of music-only intro before the guide starts speaking. */
const MUSIC_INTRO_SECONDS = 3

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
const SILENT_FRAME_SECONDS = 1152 / 44100

/** A run of silent MP3 frames lasting approximately `seconds`. */
function silenceMp3(seconds) {
  const frames = Math.max(0, Math.round(seconds / SILENT_FRAME_SECONDS))
  return Buffer.concat(Array.from({ length: frames }, () => SILENT_FRAME))
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173']

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

function isSameOrigin(origin, req) {
  try {
    return new URL(origin).host === req.get('host')
  } catch {
    return false
  }
}

app.use(cors((req, cb) => {
  const origin = req.header('Origin')
  // allow server-to-server (no origin), the site itself (same-origin requests —
  // e.g. the browser loading /assets/*.js as a module), and any explicitly
  // allowed origin (e.g. a separately hosted frontend)
  if (!origin || isSameOrigin(origin, req) || allowedOrigins.includes(origin)) {
    return cb(null, { origin: true })
  }
  cb(new Error('CORS: origin not allowed'))
}))
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

const MUSIC_FILE = join(__dirname, 'src/assets/music/SO_AM_114_melodic_loop_krishna_Cmaj.wav')
const MUSIC_VOLUME = 0.22

/**
 * Loop the background music track to match the voice audio length, mix it
 * underneath at MUSIC_VOLUME, and return a single combined MP3 buffer.
 */
async function mixMusicUnderVoice(voiceBuffer) {
  const id = randomUUID()
  const voicePath = join(tmpdir(), `yiv-voice-${id}.mp3`)
  const outputPath = join(tmpdir(), `yiv-mixed-${id}.mp3`)

  try {
    await writeFile(voicePath, voiceBuffer)

    await new Promise((resolve, reject) => {
      Ffmpeg()
        .input(voicePath)
        .input(MUSIC_FILE)
        .inputOptions(['-stream_loop', '-1'])
        .complexFilter([
          `[1:a]volume=${MUSIC_VOLUME}[music]`,
          '[0:a][music]amix=inputs=2:duration=first:normalize=0[out]',
        ])
        .outputOptions(['-map', '[out]', '-codec:a', 'libmp3lame', '-q:a', '2'])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run()
    })

    return await readFile(outputPath)
  } finally {
    await Promise.all([
      unlink(voicePath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ])
  }
}

// Explicit voice_settings overrides for user-cloned voices.
// Stability at 0.9 prevents pitch instability common in instant-cloned voices;
// speed at 0.7 matches the pacing of the preset meditation voices.
const CLONED_VOICE_SETTINGS = { speed: 0.9, stability: 0.9 }

/** Fetch an MP3 from ElevenLabs for a single line of text. */
const TTS_MAX_ATTEMPTS = 6

/**
 * One TTS call, retried when ElevenLabs is busy (429 / 5xx / timeout).
 * When two people generate at once we can exceed the plan's concurrent
 * request limit; without retries the stream would silently end early.
 */
async function callElevenLabsTts(voiceId, text, voiceSettingsOverride) {
  let lastError
  for (let attempt = 1; attempt <= TTS_MAX_ATTEMPTS; attempt++) {
    try {
      return await callElevenLabsTtsOnce(voiceId, text, voiceSettingsOverride)
    } catch (err) {
      lastError = err
      if (!err.retryable || attempt === TTS_MAX_ATTEMPTS) break
      const wait = Math.min(8000, 500 * 2 ** (attempt - 1)) + Math.random() * 400
      console.warn(`[tts] attempt ${attempt} failed (${err.message}); retrying in ${Math.round(wait)}ms`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw lastError
}

async function callElevenLabsTtsOnce(voiceId, text, voiceSettingsOverride) {
  let response
  try {
    response = await fetch(
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
        voice_settings: { ...ELEVENLABS_VOICE_SETTINGS, ...voiceSettingsOverride },
      }),
      signal: AbortSignal.timeout(ELEVENLABS_TTS_TIMEOUT_MS),
    },
  )
  } catch (err) {
    // Network error or timeout — worth another try.
    err.retryable = true
    throw err
  }

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    const error = new Error(
      parseApiError(message) || `ElevenLabs request failed (${response.status})`,
    )
    error.retryable = response.status === 429 || response.status >= 500
    throw error
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

  const presetVoice = VOICES.find((v) => v.voiceId === voiceId)
  const voiceSettingsOverride = presetVoice
    ? { speed: presetVoice.speed }
    : CLONED_VOICE_SETTINGS

  const mp3Chunks = new Array(lines.length).fill(null)
  let ptr = 0

  async function worker() {
    while (ptr < lines.length) {
      const i = ptr++
      console.log(`[generate-audio] line ${i + 1}/${lines.length}: "${lines[i]}"`)
      const raw = await callElevenLabsTts(voiceId, lines[i], voiceSettingsOverride)
      mp3Chunks[i] = stripVbrHeader(raw)
    }
  }

  await Promise.all(Array.from({ length: TTS_CONCURRENCY }, worker))

  const parts = [silenceMp3(MUSIC_INTRO_SECONDS)]
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

    let script = cleanMeditationScript(text.trim())

    // Claude doesn't hit word counts reliably (a "5 minute" draft once came back at
    // nearly twice the words). If the draft is far off, or the eyes don't open on the
    // final line, ask for one corrected version before any audio is made.
    const target = getTargetWordCount(lengthMinutes)
    const check = checkScript(script, target)
    console.log(`[generate] ${lengthMinutes} min: ${check.words} words (target ${target}), eyes-open last: ${check.eyesOpenLast}`)
    if (!check.ok) {
      try {
        const revised = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': getAnthropicKey(),
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: MEDITATION_MODEL,
            max_tokens: maxTokens,
            messages: [
              { role: 'user', content: prompt },
              { role: 'assistant', content: script },
              { role: 'user', content: buildRevisionPrompt(check, target, lengthMinutes) },
            ],
          }),
        })
        if (revised.ok) {
          const revisedData = await revised.json()
          const revisedText = revisedData.content?.find((b) => b.type === 'text')?.text
          if (revisedText?.trim()) {
            const revisedScript = cleanMeditationScript(revisedText.trim())
            const recheck = checkScript(revisedScript, target)
            console.log(`[generate] revised: ${recheck.words} words, eyes-open last: ${recheck.eyesOpenLast}`)
            if (Math.abs(recheck.words - target) <= Math.abs(check.words - target) || (!check.eyesOpenLast && recheck.eyesOpenLast)) {
              script = revisedScript
            }
          }
        }
      } catch (err) {
        console.error('[generate] revision failed, using first draft:', err.message)
      }
    }

    return res.json({ script })
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate meditation.',
    })
  }
})

app.post('/api/preview-voice', async (req, res) => {
  try {
    const { voice_id: voiceId, text } = req.body

    if (!voiceId) {
      return res.status(400).json({ error: 'voice_id is required.' })
    }

    const previewText = text?.trim() || 'Take a deep breath and allow yourself to relax.'
    const presetVoice = VOICES.find((v) => v.voiceId === voiceId)
    const voiceSettingsOverride = presetVoice ? { speed: presetVoice.speed } : CLONED_VOICE_SETTINGS

    const mp3Buffer = await callElevenLabsTts(voiceId, previewText, voiceSettingsOverride)

    res.set('Content-Type', 'audio/mpeg')
    return res.send(mp3Buffer)
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return res.status(504).json({ error: 'ElevenLabs took too long. Please try again.' })
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to generate preview.',
    })
  }
})

app.post('/api/stream-audio', async (req, res) => {
  try {
    const { script, voice_id: voiceId, length } = req.body

    if (!script?.trim() || !voiceId) {
      return res.status(400).json({ error: 'script and voice_id are required.' })
    }

    // One recording per line so every pause is ours to control (see utils/pacing.js).
    const lines = scriptToLines(script)
    const minutes = parseInt(length, 10)
    const targetSeconds = Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : null
    // The music-only intro counts toward the chosen length.
    const pacer = createPacer(lines, targetSeconds ? targetSeconds - MUSIC_INTRO_SECONDS : null)
    console.log(`[stream-audio] ${lines.length} lines to synthesise, target ${targetSeconds ?? 'none'}s`)

    const presetVoice = VOICES.find((v) => v.voiceId === voiceId)
    const voiceSettingsOverride = presetVoice
      ? { speed: presetVoice.speed }
      : CLONED_VOICE_SETTINGS

    res.set('Content-Type', 'audio/mpeg')
    res.set('Transfer-Encoding', 'chunked')
    res.set('X-Accel-Buffering', 'no')
    res.flushHeaders()

    // Process lines with concurrency, streaming each chunk as it completes
    const mp3Chunks = new Array(lines.length).fill(null)
    const done = new Array(lines.length).fill(false)
    let nextToWrite = 0
    let ptr = 0
    let failed = false

    const flush = () => {
      while (nextToWrite < lines.length && done[nextToWrite]) {
        const chunk = mp3Chunks[nextToWrite]
        if (chunk && chunk.length > 0) {
          // Let the music play on its own for a moment before the voice comes in.
          // Written with the first line (not up front) so a failed stream stays empty.
          if (nextToWrite === 0) res.write(silenceMp3(MUSIC_INTRO_SECONDS))
          res.write(chunk)
          res.write(silenceMp3(pacer.pauseAfter(nextToWrite)))
        }
        nextToWrite++
      }
      if (nextToWrite === lines.length) {
        console.log(`[stream-audio] done: ${Math.round(pacer.elapsed)}s (target ${targetSeconds ?? 'none'}s)`)
        res.end()
      }
    }

    async function worker() {
      while (ptr < lines.length && !failed) {
        const i = ptr++
        try {
          console.log(`[stream-audio] line ${i + 1}/${lines.length}: "${lines[i]}"`)
          const audio = stripVbrHeader(await callElevenLabsTts(voiceId, lines[i], voiceSettingsOverride))
          mp3Chunks[i] = audio
          pacer.setSpeech(i, mp3Seconds(audio.length))
          done[i] = true
          flush()
        } catch (err) {
          failed = true
          console.error(`[stream-audio] line ${i + 1} failed:`, err.message)
          if (!res.headersSent) {
            res.status(500).json({ error: err.message })
          } else {
            res.end()
          }
        }
      }
    }

    await Promise.all(Array.from({ length: TTS_CONCURRENCY }, worker))
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to stream audio.',
      })
    } else {
      res.end()
    }
  }
})

app.post('/api/generate-audio', async (req, res) => {
  try {
    const { script, voice_id: voiceId } = req.body

    if (!script?.trim() || !voiceId) {
      return res.status(400).json({ error: 'script and voice_id are required.' })
    }

    const voiceBuffer = await generateStitchedAudio(voiceId, script)
    console.log(`[generate-audio] Voice done — ${voiceBuffer.length} bytes, mixing music...`)

    const mp3Buffer = await mixMusicUnderVoice(voiceBuffer)
    console.log(`[generate-audio] Mixed — ${mp3Buffer.length} bytes`)

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
    formData.append('name', `Your Inner Voice ${Date.now()}`)
    formData.append('description', 'Personal voice profile created in Your Inner Voice')
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

// ---------------------------------------------------------------------------
// Voice comparison page (/voice-samples)
//
// Plays one fixed passage in each candidate voice so we can compare them.
// Only these voices and this passage can be rendered, and each sample is
// cached after its first render, so the page can't be used to run up TTS cost.
// ---------------------------------------------------------------------------
const SAMPLE_VOICES = [
  { key: 'regina', name: 'Regina', voiceId: 'eBthAb30UYbt2nojGXeA', note: 'Mature, calm and deep, meditative', isNew: true, batch: 2 },
  { key: 'lavender', name: 'LavenderLessons', voiceId: 'QwvsCFsQcnpWxmP1z7V9', note: 'Middle-aged American, soft and melodious', isNew: true, batch: 2 },
  { key: 'alexis', name: 'Alexis Lancaster', voiceId: 'O4fnkotIypvedJqBp4yb', note: 'British, silky, rich and soft', isNew: true, batch: 2 },
  { key: 'veda', name: 'Veda Sky', voiceId: 'XcXEQzuLXRU9RcfWzEJt', note: 'Natural, mindful and caring', isNew: true, batch: 2 },
  { key: 'arabella', name: 'Arabella', voiceId: 'Z3R5wn05IrDiVCyEkUrK', note: 'Mysterious, emotive storyteller', isNew: true, batch: 2 },
  { key: 'jane', name: 'Jane Doe', voiceId: 'SaqYcK3ZpDKBAImA8AdW', note: 'Young, warm, intimate', isNew: true, batch: 2 },
  { key: 'ana-rita', name: 'Ana Rita', voiceId: 'wJqPPQ618aTW29mptyoc', note: 'Young British, smooth and bright', isNew: true, batch: 2 },
  { key: 'charmion', name: 'Charmion', voiceId: 'lUCNYQh2kqW2wiie85Qk', note: 'Middle-aged British, soft and husky', isNew: true, batch: 2 },
  { key: 'serafina', name: 'Serafina', voiceId: '4tRn1lSkEn13EVTuqb0g', note: 'Deep, velvety American', isNew: true, batch: 2 },
  { key: 'brittney', name: 'Brittney', voiceId: 'pjcYQlDFKMbcOUp6F5GD', note: 'Smooth, measured and calm', isNew: true },
  { key: 'hope', name: 'Hope', voiceId: 'iCrDUkL56s3C8sCRl7wb', note: 'Warm, poetic and captivating', isNew: true },
  { key: 'danielle', name: 'Danielle', voiceId: 'FVQMzxJGPUBtfz1Azdoy', note: 'Gentle, engaging Canadian narrator', isNew: true },
  { key: 'delilah', name: 'Delilah', voiceId: 'mZ3kbJNnKRWI4YzJXA9j', note: 'Relaxing, slightly sultry', isNew: true },
  { key: 'natasha', name: 'Natasha', voiceId: 'Atp5cNFg1Wj5gyKD7HWV', note: 'Soft, half-whispered, American', isNew: true },
  { key: 'emily', name: 'Emily', voiceId: '1cxc5c3E9K6F1wlqOJGV', note: 'Whisper, young Northern Irish', isNew: true },
  { key: 'aimee', name: 'AImee', voiceId: 'zA6D7RyKdc2EClouEMkP', note: 'Tranquil ASMR whisper', isNew: true },
  ...VOICES.filter((v) => ['nicole', 'kristen'].includes(v.id)).map((v) => ({
    key: v.id, name: v.name, voiceId: v.voiceId, note: 'In the app now', isNew: false,
  })),
]
const SAMPLE_SCRIPT = `Close your eyes, and let your breath slow down.
Feel the weight of your body, fully supported.
You are already the person you are becoming.
Notice the part of you that has always known this.
What would you do today if you trusted yourself completely?
Let that answer rise, without forcing it.
You belong in every room you walk into.
Breathe that in. It is true.`
const sampleCache = new Map() // key -> Promise<Buffer>

async function renderSample(voice) {
  const lines = scriptToLines(SAMPLE_SCRIPT)
  const pacer = createPacer(lines, null)
  const preset = VOICES.find((v) => v.voiceId === voice.voiceId)
  const settings = preset ? { speed: preset.speed } : CLONED_VOICE_SETTINGS
  const parts = []
  for (let i = 0; i < lines.length; i++) {
    const audio = stripVbrHeader(await callElevenLabsTts(voice.voiceId, lines[i], settings))
    pacer.setSpeech(i, mp3Seconds(audio.length))
    parts.push(audio, silenceMp3(pacer.pauseAfter(i)))
  }
  return Buffer.concat(parts)
}

app.get('/api/voice-sample/:key', async (req, res) => {
  const voice = SAMPLE_VOICES.find((v) => v.key === req.params.key)
  if (!voice) return res.status(404).json({ error: 'Unknown voice.' })
  if (!sampleCache.has(voice.key)) {
    const job = renderSample(voice)
    sampleCache.set(voice.key, job)
    job.catch(() => sampleCache.delete(voice.key))
  }
  try {
    const buf = await sampleCache.get(voice.key)
    res.set('Content-Type', 'audio/mpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    return res.send(buf)
  } catch (err) {
    console.error(`[voice-sample] ${voice.name} failed:`, err.message)
    return res.status(502).json({ error: 'Could not make this sample. Try again.' })
  }
})

app.get('/voice-samples', (_req, res) => {
  const colors = ['#F26BB5', '#EDF23A', '#3BE07A', '#4D8DFF', '#B49CFF', '#FF9B4A']
  const cards = SAMPLE_VOICES.map((v, i) => `
    <div class="card" style="background:${colors[i % colors.length]}">
      <div class="row"><span class="name">${v.name}</span><span class="tag">${v.batch === 2 ? 'New' : v.isNew ? 'Earlier batch' : 'Current'}</span></div>
      <div class="note">${v.note}</div>
      <audio controls preload="none" src="/api/voice-sample/${v.key}"></audio>
    </div>`).join('')
  res.set('Content-Type', 'text/html; charset=utf-8')
  res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Voice samples</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap">
<style>
body{margin:0;background:#0B0B0C;color:#fff;font-family:Outfit,sans-serif}
.wrap{max-width:520px;margin:0 auto;padding:40px 16px 60px}
h1{margin:0;font-weight:500;font-size:32px;line-height:1.05;text-transform:uppercase}
p{font-weight:300;color:rgba(255,255,255,.72);font-size:15px;line-height:1.5}
.card{color:#0B0B0C;border-radius:24px;padding:16px 18px;margin-bottom:10px}
.row{display:flex;justify-content:space-between;align-items:baseline}
.name{font-size:22px;font-weight:600;text-transform:uppercase}
.tag{font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase}
.note{font-size:14px;margin:2px 0 10px}
audio{width:100%;height:36px}
</style></head><body><div class="wrap">
<h1>Voice samples</h1>
<p>The same 8 lines in every voice, with the app's real pauses. The newest batch of women's voices is on top, then the earlier batch, then Nicole and Kristen from the app for comparison. The first play of each voice can take about 15 seconds to load.</p>
${cards}
<p>Script: ${SAMPLE_SCRIPT.split('\n').join(' / ')}</p>
</div>
<script>document.querySelectorAll('audio').forEach(a=>a.addEventListener('play',()=>document.querySelectorAll('audio').forEach(o=>{if(o!==a)o.pause()})))</script>
</body></html>`)
})

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const { existsSync } = await import('node:fs')
  if (existsSync(join(__dirname, 'dist'))) {
    const { default: serveStatic } = await import('serve-static')
    app.use(serveStatic(join(__dirname, 'dist')))
    app.get('/{*path}', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))
  }
}

const server = app.listen(PORT, () => {
  console.log(`Your Inner Voice API server running on http://localhost:${PORT}`)
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
