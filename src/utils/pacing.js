// Pacing for spoken meditations.
//
// Every script line is synthesised on its own and followed by a stretch of
// silence. How long that silence is depends on what kind of line it is, and is
// then scaled up or down as the audio is built so the whole meditation lands on
// the length the listener chose.

/** Seconds of silence after a line, before any length adjustment. */
export const BASE_PAUSE = {
  comma: 0.5, // mid-thought, the next line continues it
  sentence: 1.7, // an ordinary statement
  ellipsis: 3.2, // a soft, lingering beat
  question: 4.5, // something to reflect on
  final: 4, // after the last line
}

/** Never go below these, however tight the timing (questions: at least 3s to reflect). */
const MIN_PAUSE = { comma: 0.35, sentence: 1.2, ellipsis: 2.5, question: 3.0, final: 2 }
/** Never stretch beyond these, however much time is left. */
const MAX_PAUSE = { comma: 1.2, sentence: 4.5, ellipsis: 7, question: 9, final: 25 }

const SCALE_MIN = 0.6
const SCALE_MAX = 2.6
/** Assumed seconds per word until real measurements arrive (measured ~0.47–0.58 across voices). */
const DEFAULT_SECONDS_PER_WORD = 0.55

export function lineKind(line, isLast = false) {
  if (isLast) return 'final'
  const t = line.trim()
  if (/\?\s*(?:\.{2,}|…)?["'”’)]*$/.test(t)) return 'question'
  if (/(?:\.{2,}|…)["'”’)]*$/.test(t)) return 'ellipsis'
  if (/[,;:—–-]["'”’)]*$/.test(t)) return 'comma'
  return 'sentence'
}

export function countWords(line) {
  return line.split(/\s+/).filter(Boolean).length
}

/**
 * Tracks the meditation as it's assembled and decides each pause.
 * Call setSpeech(i, seconds) whenever a line's audio is ready (any order),
 * then pauseAfter(i) in line order as each line is written out.
 */
export function createPacer(lines, targetSeconds) {
  const n = lines.length
  const kinds = lines.map((l, i) => lineKind(l, i === n - 1))
  const words = lines.map(countWords)
  const base = kinds.map((k) => BASE_PAUSE[k])
  const speech = new Array(n).fill(null)
  let elapsed = 0

  const secondsPerWord = () => {
    let s = 0
    let w = 0
    for (let i = 0; i < n; i++) {
      if (speech[i] != null) {
        s += speech[i]
        w += words[i]
      }
    }
    return w > 0 ? s / w : DEFAULT_SECONDS_PER_WORD
  }

  return {
    kinds,
    setSpeech(i, seconds) {
      speech[i] = seconds
    },
    /** Call after line i's speech has been written; returns the silence (s) to write next. */
    pauseAfter(i) {
      elapsed += speech[i] ?? words[i] * secondsPerWord()
      const kind = kinds[i]
      let pause = base[i]

      if (targetSeconds) {
        if (kind === 'final') {
          pause = targetSeconds - elapsed
        } else {
          const spw = secondsPerWord()
          let remainingSpeech = 0
          let remainingBase = 0
          for (let j = i + 1; j < n; j++) remainingSpeech += speech[j] ?? words[j] * spw
          for (let j = i; j < n; j++) remainingBase += base[j]
          const available = targetSeconds - elapsed - remainingSpeech
          const scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, available / remainingBase))
          pause = base[i] * scale
        }
      }

      pause = Math.min(MAX_PAUSE[kind], Math.max(MIN_PAUSE[kind], pause))
      elapsed += pause
      return pause
    },
    get elapsed() {
      return elapsed
    },
  }
}

/** Approximate duration of a CBR 128 kbps MP3 buffer. */
export function mp3Seconds(byteLength, kbps = 128) {
  return (byteLength * 8) / (kbps * 1000)
}
