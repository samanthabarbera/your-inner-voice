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
  scriptForTts,
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

function buildElevenLabsTtsPayload(text) {
  return {
    text,
    model_id: ELEVENLABS_TTS_MODEL,
    // Normalization must be off when SSML break tags are present
    apply_text_normalization: /<break\s/i.test(text) ? 'off' : 'on',
    voice_settings: { ...ELEVENLABS_VOICE_SETTINGS },
  }
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
      return res.status(500).json({ error: 'Claude returned an empty meditation script.' })
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
      return res.status(400).json({ error: 'script and voice_id are required.' })
    }

    const ttsText = scriptForTts(script)
    console.log('[generate-audio] Text sent to ElevenLabs (first 500 chars):', ttsText.slice(0, 500))

    const audioBuffer = await callElevenLabsTts(voiceId, ttsText)

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
