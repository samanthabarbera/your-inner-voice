import { useCallback, useEffect, useRef, useState } from 'react'
import { VOICE_PREVIEW_TEXT } from '../data/builderOptions'
import { textToSpeech } from '../lib/elevenlabs'

export function useVoicePreview() {
  const audioRef = useRef(null)
  const objectUrlRef = useRef(null)
  const abortRef = useRef(null)
  const activeRequestRef = useRef(0)
  const [loadingVoiceId, setLoadingVoiceId] = useState(null)
  const [playingVoiceId, setPlayingVoiceId] = useState(null)
  const [previewError, setPreviewError] = useState(null)

  const stopAudio = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
      audioRef.current.onerror = null
      audioRef.current.src = ''
      audioRef.current = null
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setPlayingVoiceId(null)
  }, [])

  const stopPreview = useCallback(() => {
    activeRequestRef.current += 1
    stopAudio()
    setLoadingVoiceId(null)
  }, [stopAudio])

  const playAudioBlob = useCallback(
    async (blob, trackId, requestId) => {
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setPlayingVoiceId(null)
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }
        audioRef.current = null
      }

      audio.onerror = () => {
        setPreviewError('Unable to play this preview. Please try again.')
        stopAudio()
      }

      await audio.play()

      if (activeRequestRef.current !== requestId) {
        stopAudio()
        return
      }

      setPlayingVoiceId(trackId)
    },
    [stopAudio],
  )

  const playPreview = useCallback(
    async (voice, text = VOICE_PREVIEW_TEXT) => {
      stopAudio()
      setPreviewError(null)

      const requestId = activeRequestRef.current + 1
      activeRequestRef.current = requestId
      setLoadingVoiceId(voice.id)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const blob = await textToSpeech(voice.voiceId, text, controller.signal)

        if (activeRequestRef.current !== requestId) return

        await playAudioBlob(blob, voice.id, requestId)
      } catch (error) {
        if (error.name === 'AbortError') return
        if (activeRequestRef.current !== requestId) return

        setPreviewError(
          error instanceof Error
            ? error.message
            : 'Unable to load voice preview.',
        )
        stopAudio()
      } finally {
        if (activeRequestRef.current === requestId) {
          setLoadingVoiceId(null)
        }
      }
    },
    [playAudioBlob, stopAudio],
  )

  const playPreviewByVoiceId = useCallback(
    async (elevenLabsVoiceId, trackId, text = VOICE_PREVIEW_TEXT) => {
      stopAudio()
      setPreviewError(null)

      const requestId = activeRequestRef.current + 1
      activeRequestRef.current = requestId
      setLoadingVoiceId(trackId)

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const blob = await textToSpeech(
          elevenLabsVoiceId,
          text,
          controller.signal,
        )

        if (activeRequestRef.current !== requestId) return

        await playAudioBlob(blob, trackId, requestId)
      } catch (error) {
        if (error.name === 'AbortError') return
        if (activeRequestRef.current !== requestId) return

        setPreviewError(
          error instanceof Error
            ? error.message
            : 'Unable to load voice preview.',
        )
        stopAudio()
      } finally {
        if (activeRequestRef.current === requestId) {
          setLoadingVoiceId(null)
        }
      }
    },
    [playAudioBlob, stopAudio],
  )

  useEffect(() => () => stopPreview(), [stopPreview])

  return {
    playPreview,
    playPreviewByVoiceId,
    stopPreview,
    loadingVoiceId,
    playingVoiceId,
    previewError,
    setPreviewError,
  }
}
