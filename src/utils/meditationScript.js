const PART_LABEL_LINE_PATTERN =
  /^\s*(?:#{1,6}\s*)?(?:PART|Part)\s*\d+\b.*$/i
const PART_LABEL_PREFIX_PATTERN =
  /^\s*(?:#{1,6}\s*)?(?:PART|Part)\s*\d+\s*[:\-—–.]?\s*/i

function isDividerLine(line) {
  const trimmed = line.trim()
  return trimmed.length > 0 && /^[\s\-—–_=~*·.]+$/.test(trimmed)
}

function isBreakTagLine(line) {
  return /^<break\s/i.test(line.trim())
}

function stripPartLabelsAndDividers(script) {
  return script
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return false
      if (isBreakTagLine(trimmed)) return false
      if (PART_LABEL_LINE_PATTERN.test(trimmed)) return false
      if (isDividerLine(trimmed)) return false
      return true
    })
    .map((line) => line.replace(PART_LABEL_PREFIX_PATTERN, '').trim())
    .filter((line) => line.length > 0 && !PART_LABEL_LINE_PATTERN.test(line))
    .join('\n')
}

/** Clean script after Claude generation — removes part labels, dividers, break tags, and the COMPLETE marker. */
export function cleanMeditationScript(script) {
  return stripPartLabelsAndDividers(
    script.replace(/\s*COMPLETE\s*$/i, '').trim(),
  ).trim()
}

/**
 * Convert the cleaned script into a single ElevenLabs-ready string.
 * Each line of spoken text is separated by a real 2-second SSML break
 * so ElevenLabs inserts genuine silence between phrases.
 */
export function scriptForTts(script) {
  return cleanMeditationScript(script)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' <break time="2s"/> ')
    .trim()
}
