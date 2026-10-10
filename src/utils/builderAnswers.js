import { LENGTHS, THEMES } from '../data/builderOptions.js'

export function getThemeLabel(themeId) {
  return THEMES.find((theme) => theme.id === themeId)?.label ?? 'Your Meditation'
}

export function getLengthMinutes(lengthId) {
  return LENGTHS.find((length) => length.id === String(lengthId))?.minutes ?? 10
}
