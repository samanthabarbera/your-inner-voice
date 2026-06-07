import { useCallback, useEffect, useRef, useState } from 'react'
import { generateMeditationScript } from '../lib/anthropic'
import { generateMeditationSpeech } from '../lib/elevenlabs'
import { getThemeLabel } from '../utils/builderAnswers'
import { getElevenLabsVoiceId } from '../utils/voiceSelection'

export function useMeditationGeneration(answers) {
  const [phase, setPhase] = useState('writing')
  const [errorSource, setErrorSource] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [script, setScript] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const abortRef = useRef(null)
  const runIdRef = useRef(0)
  const audioUrlRef = useRef(null)

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setAudioUrl(null)
  }, [])

  const generate = useCallback(async () => {
    const runId = ++runIdRef.current
    abortRef.current?.abort()

    const controller = new AbortController()
    abortRef.current = controller

    revokeAudioUrl()
    setAudioBlob(null)
    setScript(null)
    setErrorSource(null)
    setErrorMessage(null)
    setPhase('writing')

    let failedStep = 'claude'

    try {
      const cleanedScript = await generateMeditationScript(
        {
          theme: answers.theme,
          situation: answers.context,
          length: answers.length,
        },
        controller.signal,
      )

      if (runId !== runIdRef.current) return

      setScript(cleanedScript)
      setPhase('voicing')
      failedStep = 'elevenlabs'

      const voiceId = getElevenLabsVoiceId(answers)
      if (!voiceId) {
        throw new Error('No voice selected.')
      }

      const blob = await generateMeditationSpeech(
        voiceId,
        cleanedScript,
        controller.signal,
      )

      if (runId !== runIdRef.current) return

      const url = URL.createObjectURL(blob)
      audioUrlRef.current = url
      setAudioBlob(blob)
      setAudioUrl(url)
      setPhase('ready')
    } catch (error) {
      if (error.name === 'AbortError') return
      if (runId !== runIdRef.current) return

      setErrorSource(failedStep)
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong.',
      )
      setPhase('error')
    }
  }, [answers, revokeAudioUrl])

  useEffect(() => {
    generate()

    return () => {
      runIdRef.current += 1
      abortRef.current?.abort()
      revokeAudioUrl()
    }
  }, [generate, revokeAudioUrl])

  const retry = useCallback(() => {
    generate()
  }, [generate])

  return {
    phase,
    errorSource,
    errorMessage,
    script,
    audioBlob,
    audioUrl,
    retry,
    title: getThemeLabel(answers.theme),
  }
}
