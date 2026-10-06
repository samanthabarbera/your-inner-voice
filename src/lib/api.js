// In production the API is served by the same Express server as the site, so a
// relative path always works. Locally, Vite runs on :5173 and the API on :3001.
// VITE_API_URL can still override either (e.g. a separately hosted frontend).
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')

async function readErrorMessage(response) {
  try {
    const data = await response.json()
    return data.error || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

/**
 * @param {{ theme: string, situation?: string, length: string }} params
 * @returns {Promise<string>}
 */
export async function generateMeditationScript(
  { theme, situation, length },
  signal,
) {
  const response = await fetch(`${API_BASE}/generate-meditation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, situation, length }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const data = await response.json()
  return data.script
}

/**
 * @returns {Promise<Blob>}
 */
export async function generateMeditationAudio(script, voiceId, signal) {
  const response = await fetch(`${API_BASE}/generate-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, voice_id: voiceId }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.blob()
}

/** @returns {Promise<string>} ElevenLabs voice_id */
export async function createInstantVoiceClone(audioBlob, signal) {
  const formData = new FormData()
  const extension = audioBlob.type?.includes('webm') ? 'webm' : 'm4a'
  formData.append('file', audioBlob, `recording.${extension}`)

  const response = await fetch(`${API_BASE}/clone-voice`, {
    method: 'POST',
    body: formData,
    signal,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const data = await response.json()
  return data.voice_id
}

/**
 * @returns {Promise<Blob>}
 */
export async function previewVoice(voiceId, text, signal) {
  const response = await fetch(`${API_BASE}/preview-voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_id: voiceId, text }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response.blob()
}

/**
 * Returns a fetch Response whose body streams MP3 chunks as they are synthesised.
 * @returns {Promise<Response>}
 */
export async function streamMeditationAudio(script, voiceId, signal) {
  const response = await fetch(`${API_BASE}/stream-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, voice_id: voiceId }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return response
}
