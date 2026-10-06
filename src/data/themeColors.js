// Each theme keeps its own color everywhere in the app (Look F · Pop).
// Text on these colors is always near-black (#0B0B0C) for contrast.
export const THEME_COLORS = {
  love: '#F26BB5',
  money: '#EDF23A',
  confidence: '#3BE07A',
  health: '#4D8DFF',
  career: '#B49CFF',
  'letting-go': '#FF9B4A',
  universe: '#F26BB5',
}

export const POP_INK = '#0B0B0C'

export function themeColor(themeId) {
  return THEME_COLORS[themeId] || '#FFFFFF'
}
