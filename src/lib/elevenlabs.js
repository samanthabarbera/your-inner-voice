import {
  generateMeditationAudio,
  streamMeditationAudio,
  previewVoice,
  createInstantVoiceClone,
} from './api.js'

export async function textToSpeech(voiceId, text, signal) {
  return previewVoice(voiceId, text, signal)
}

export async function generateFullAudio(voiceId, script, signal) {
  return generateMeditationAudio(script, voiceId, signal)
}

export async function streamFullAudio(voiceId, script, signal, length) {
  return streamMeditationAudio(script, voiceId, signal, length)
}

export const fetchVoicePreview = textToSpeech
export const generateMeditationSpeech = generateFullAudio
export { createInstantVoiceClone }
