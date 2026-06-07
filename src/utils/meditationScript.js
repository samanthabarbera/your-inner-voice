const PART_LABEL_LINE_PATTERN =
  /^\s*(?:#{1,6}\s*)?(?:PART|Part)\s*\d+\b.*$/i
const PART_LABEL_PREFIX_PATTERN =
  /^\s*(?:#{1,6}\s*)?(?:PART|Part)\s*\d+\s*[:\-—–.]?\s*/i

function isDividerLine(line) {
  const trimmed = line.trim()
  return trimmed.length > 0 && /^[\s\-—–_=~*·.]+$/.test(trimmed)
}

const BREAK_TAG_PATTERN = /^<break\s/i
const SSML_BREAK_PATTERN = /<break\s+time="(\d+(?:\.\d+)?)s"\s*\/>/gi

function isBreakTagLine(line) {
  return BREAK_TAG_PATTERN.test(line.trim())
}

/** Convert line-based script to inline SSML (matches the working test format). */
export function toInlineSsml(script) {
  const parts = []

  for (const line of script.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (isBreakTagLine(trimmed)) {
      parts.push(trimmed)
    } else {
      parts.push(trimmed.endsWith('.') ? trimmed : `${trimmed}.`)
    }
  }

  return parts.join(' ')
}

/** Cap break tags at 8 seconds — values above that are reduced before TTS. */
export function clampSsmlBreakDurations(script) {
  return script.replace(SSML_BREAK_PATTERN, (_match, seconds) => {
    const clamped = Math.min(parseFloat(seconds), 8)
    return `<break time="${clamped}s"/>`
  })
}

function stripPartLabelsAndDividers(script) {
  return script
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return false
      // Always preserve SSML break tags — never strip these.
      if (isBreakTagLine(trimmed)) return true
      if (PART_LABEL_LINE_PATTERN.test(trimmed)) return false
      if (isDividerLine(trimmed)) return false
      return true
    })
    .map((line) => line.replace(PART_LABEL_PREFIX_PATTERN, '').trim())
    .filter((line) => line.length > 0 && !PART_LABEL_LINE_PATTERN.test(line))
    .join('\n')
}

/** Clean script after Claude generation (COMPLETE marker, part labels, dividers). */
export function cleanMeditationScript(script) {
  return stripPartLabelsAndDividers(
    script.replace(/\s*COMPLETE\s*$/i, '').trim(),
  ).trim()
}

/** Final pass before sending text to ElevenLabs. */
export function prepareScriptForSpeech(script) {
  return clampSsmlBreakDurations(cleanMeditationScript(script))
}
