/**
 * Shared ElevenLabs voice settings for every text-to-speech call
 * (voice previews, meditation generation, etc.).
 *
 * Adjust these values here to tune output app-wide.
 */
export const ELEVENLABS_VOICE_SETTINGS = {
  speed: 0.7,
  stability: 0.9,
  similarity_boost: 0.75,
  style: 0.05,
}

/** Default TTS model for all speech generation. */
export const ELEVENLABS_MODEL_ID = 'eleven_turbo_v2_5'
