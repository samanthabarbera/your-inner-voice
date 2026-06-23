export const RECORDING_MIN_SECONDS = 20
export const RECORDING_MAX_SECONDS = 45

export const CUSTOM_VOICE_OPTION_ID = 'custom'

export const OWN_VOICE_OPTION = {
  id: CUSTOM_VOICE_OPTION_ID,
  name: 'Use My Own Voice',
  description: 'Your voice, your meditation.',
}

export const CUSTOM_VOICE_CONFIRMATION_TEXT =
  'Take a deep breath and let yourself relax into this moment.'

export const RECORDING_SCRIPT = [
  { text: 'Read the lines below slowly and warmly, like you\'re reassuring someone you love.', isDirection: true },
  { text: 'Hi. I\'m so glad you\'re here.' },
  { text: 'Just breathe with me for a moment.' },
  { text: 'In... and out.' },
  { text: 'There\'s nowhere you need to be right now.' },
  { text: 'Nothing you need to fix.' },
  { text: 'You\'re allowed to slow down.' },
  { text: 'You\'re allowed to feel calm.' },
  { text: 'I believe in you.' },
  { text: 'You are capable of more than you know.' },
  { text: 'And you are exactly where you\'re supposed to be.' },
]

export const CLONED_VOICE_DISCLAIMER =
  'Your cloned voice will sound similar to you. Like all AI-generated voices, it may occasionally sound less naturally expressive than our professionally designed preset voices — especially on longer meditations.'
