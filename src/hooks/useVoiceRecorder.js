import { useCallback, useEffect, useRef, useState } from 'react'
import { RECORDING_MAX_SECONDS } from '../data/voiceRecording'

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [waveformLevels, setWaveformLevels] = useState(() => Array(24).fill(0.15))
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(null)

  const stopWaveformLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  const cleanupStream = useCallback(() => {
    stopWaveformLoop()

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    analyserRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    mediaRecorderRef.current = null
  }, [stopWaveformLoop])

  const startWaveformLoop = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const data = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      const sliceSize = Math.floor(data.length / 24)
      const levels = Array.from({ length: 24 }, (_, index) => {
        const start = index * sliceSize
        const slice = data.slice(start, start + sliceSize)
        const average =
          slice.reduce((sum, value) => sum + value, 0) / (slice.length || 1)
        return Math.max(0.12, Math.min(1, average / 128))
      })
      setWaveformLevels(levels)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    tick()
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    setElapsedSeconds(0)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ]
      const mimeType =
        preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) ??
        ''

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        setAudioBlob(blob)
        setIsRecording(false)
        stopWaveformLoop()
        cleanupStream()
      }

      recorder.start(250)
      startTimeRef.current = Date.now()
      setIsRecording(true)
      startWaveformLoop()
    } catch (err) {
      cleanupStream()
      setIsRecording(false)
      setError(
        err instanceof Error
          ? err.message
          : 'Microphone access is required to record your voice.',
      )
    }
  }, [cleanupStream, startWaveformLoop])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }, [])

  const resetRecording = useCallback(() => {
    cleanupStream()
    setIsRecording(false)
    setElapsedSeconds(0)
    setAudioBlob(null)
    setError(null)
    setWaveformLevels(Array(24).fill(0.15))
    chunksRef.current = []
    startTimeRef.current = null
  }, [cleanupStream])

  useEffect(() => {
    if (!isRecording) return undefined

    const interval = window.setInterval(() => {
      if (!startTimeRef.current) return
      const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000)
      setElapsedSeconds(seconds)

      if (seconds >= RECORDING_MAX_SECONDS) {
        stopRecording()
      }
    }, 200)

    return () => window.clearInterval(interval)
  }, [isRecording, stopRecording])

  useEffect(() => () => cleanupStream(), [cleanupStream])

  return {
    isRecording,
    elapsedSeconds,
    audioBlob,
    waveformLevels,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  }
}
