import { useCallback, useEffect, useRef, useState } from 'react'

const WAVEFORM_IDLE = Array(32).fill(0.15)
const WAVEFORM_ACTIVE = Array.from({ length: 32 }, (_, i) =>
  0.3 + 0.5 * Math.abs(Math.sin(i * 0.4)),
)

export function useAudioPlayer(audioUrl, { autoPlay = true, onEnded } = {}) {
  const audioRef = useRef(null)
  const onEndedRef = useRef(onEnded)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  onEndedRef.current = onEnded

  useEffect(() => {
    if (!audioUrl) return undefined

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      setIsPlaying(false)
      onEndedRef.current?.()
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    if (autoPlay) {
      audio.play().catch(() => {})
    }

    return () => {
      audio.pause()
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audioRef.current = null
    }
  }, [audioUrl, autoPlay])

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch((err) => console.error('[audio] play failed:', err))
    } else {
      audio.pause()
    }
  }, [])

  const progress = duration > 0 ? currentTime / duration : 0

  return {
    isPlaying,
    currentTime,
    duration,
    progress,
    waveformLevels: isPlaying ? WAVEFORM_ACTIVE : WAVEFORM_IDLE,
    togglePlayback,
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export { formatTime }
