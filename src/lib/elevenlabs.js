import {
  generateMeditationAudio,
  createInstantVoiceClone,
} from './api.js'

export async function textToSpeech(voiceId, text, signal) {
  return generateMeditationAudio(text, voiceId, signal)
}

export const fetchVoicePreview = textToSpeech
export const generateMeditationSpeech = textToSpeech
export { createInstantVoiceClone }
