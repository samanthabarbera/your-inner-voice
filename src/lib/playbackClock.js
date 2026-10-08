/**
 * Lets the streaming code ask "how far into this audio is the listener?"
 *
 * The browser's MediaSource buffer only holds ~12 minutes of MP3, so for long
 * meditations the streamer must drop audio that has already been heard. The
 * player registers its <audio> element here under the object URL it plays.
 */
const clocks = new Map()

export function registerPlaybackClock(url, audio) {
  clocks.set(url, audio)
  return () => {
    if (clocks.get(url) === audio) clocks.delete(url)
  }
}

/** Current playback position in seconds for `url`, or null if not playing yet. */
export function getPlaybackTime(url) {
  const audio = clocks.get(url)
  return audio ? audio.currentTime : null
}
