import { CUSTOM_VOICE_OPTION_ID } from '../data/voiceRecording'
import { VOICES } from '../data/builderOptions'

/** Resolve the ElevenLabs voice_id used for TTS from builder answers. */
export function getElevenLabsVoiceId(answers) {
  if (answers.voice === CUSTOM_VOICE_OPTION_ID) {
    return answers.customVoiceId ?? null
  }

  const preset = VOICES.find((voice) => voice.id === answers.voice)
  return preset?.voiceId ?? null
}

export function isVoiceStepComplete(answers) {
  if (!answers.voice) return false
  if (answers.voice === CUSTOM_VOICE_OPTION_ID) {
    return Boolean(answers.customVoiceId)
  }
  return true
}
