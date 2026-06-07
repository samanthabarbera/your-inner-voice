import { useCallback, useEffect, useRef, useState } from 'react'

export function useAudioPlayer(audioUrl, { autoPlay = true, onEnded } = {}) {
  const audioRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const animationFrameRef = useRef(null)
  const onEndedRef = useRef(onEnded)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [waveformLevels, setWaveformLevels] = useState(() => Array(32).fill(0.15))

  onEndedRef.current = onEnded

  const stopWaveformLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const startWaveformLoop = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      const sliceSize = Math.floor(data.length / 32)
      const levels = Array.from({ length: 32 }, (_, index) => {
        const start = index * sliceSize
        const slice = data.slice(start, start + sliceSize)
        const average =
          slice.reduce((sum, value) => sum + value, 0) / (slice.length || 1)
        return Math.max(0.12, Math.min(1, average / 110))
      })
      setWaveformLevels(levels)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    tick()
  }, [])

  const setupAnalyser = useCallback((audio) => {
    if (sourceRef.current) return

    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    const source = audioContext.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    sourceRef.current = source
  }, [])

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    setupAnalyser(audio)

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    await audio.play()
    setIsPlaying(true)
    startWaveformLoop()
  }, [setupAnalyser, startWaveformLoop])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.pause()
    setIsPlaying(false)
    stopWaveformLoop()
    setWaveformLevels(Array(32).fill(0.15))
  }, [stopWaveformLoop])

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play().catch(() => {})
    }
  }, [isPlaying, pause, play])

  useEffect(() => {
    if (!audioUrl) return undefined

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration || 0)
    const handleEnded = () => {
      setIsPlaying(false)
      stopWaveformLoop()
      setWaveformLevels(Array(32).fill(0.15))
      onEndedRef.current?.()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    if (autoPlay) {
      // Don't route through AudioContext here — AudioContext.resume() needs a
      // user gesture and will silence the audio if suspended. Play directly
      // through the HTML audio element; the analyser gets wired up on first
      // manual play() call (which is always a user gesture).
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {})
    }

    return () => {
      stopWaveformLoop()
      audio.pause()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audioRef.current = null

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }

      analyserRef.current = null
      sourceRef.current = null
    }
  }, [audioUrl, autoPlay, setupAnalyser, startWaveformLoop, stopWaveformLoop])

  const progress = duration > 0 ? currentTime / duration : 0

  return {
    isPlaying,
    currentTime,
    duration,
    progress,
    waveformLevels,
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
