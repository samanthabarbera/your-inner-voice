import { useCallback, useEffect, useRef, useState } from 'react'
import { generateMeditationScript } from '../lib/anthropic'
import { streamFullAudio } from '../lib/elevenlabs'
import { getThemeLabel } from '../utils/builderAnswers'
import { getElevenLabsVoiceId } from '../utils/voiceSelection'

/**
 * Streams voice audio from /api/stream-audio via MediaSource API.
 * Returns an objectURL that starts playing as soon as the first MP3 chunk arrives.
 */
async function createStreamingUrl(response, onReady, signal) {
  return new Promise((resolve, reject) => {
    if (!window.MediaSource) {
      // Fallback: just collect the whole blob
      response.blob().then(blob => resolve(URL.createObjectURL(blob))).catch(reject)
      return
    }

    const ms = new MediaSource()
    const url = URL.createObjectURL(ms)

    ms.addEventListener('sourceopen', async () => {
      let sb
      try {
        sb = ms.addSourceBuffer('audio/mpeg')
      } catch {
        // Browser doesn't support audio/mpeg in MediaSource, fall back
        URL.revokeObjectURL(url)
        response.blob().then(blob => resolve(URL.createObjectURL(blob))).catch(reject)
        return
      }

      let readyCalled = false
      const reader = response.body.getReader()
      const queue = []
      let appending = false

      const appendNext = () => {
        if (appending || queue.length === 0 || sb.updating) return
        appending = true
        const chunk = queue.shift()
        try {
          sb.appendBuffer(chunk)
        } catch (e) {
          appending = false
        }
      }

      sb.addEventListener('updateend', () => {
        appending = false
        if (!readyCalled) {
          readyCalled = true
          onReady(url)
          resolve(url)
        }
        appendNext()
      })

      try {
        while (true) {
          if (signal?.aborted) break
          const { done, value } = await reader.read()
          if (done) {
            // Drain remaining queue then end stream
            const drain = () => {
              if (queue.length === 0 && !sb.updating) {
                if (ms.readyState === 'open') ms.endOfStream()
              } else {
                setTimeout(drain, 50)
              }
            }
            drain()
            break
          }
          queue.push(value)
          appendNext()
        }
      } catch (e) {
        if (!signal?.aborted) reject(e)
      }
    })

    // Signal the URL is available immediately so the audio element can be created
    // (it won't play until onReady fires with the first chunk)
  })
}

export function useStreamingMeditation(answers) {
  const [phase, setPhase] = useState('writing')
  const [errorSource, setErrorSource] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [script, setScript] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioBlob] = useState(null) // kept for save compatibility
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
    setScript(null)
    setErrorSource(null)
    setErrorMessage(null)
    setPhase('writing')

    let failedStep = 'claude'

    try {
      const cleanedScript = await generateMeditationScript(
        { theme: answers.theme, situation: answers.context, length: answers.length },
        controller.signal,
      )

      if (runId !== runIdRef.current) return

      setScript(cleanedScript)
      setPhase('voicing')
      failedStep = 'elevenlabs'

      const voiceId = getElevenLabsVoiceId(answers)
      if (!voiceId) throw new Error('No voice selected.')

      const response = await streamFullAudio(voiceId, cleanedScript, controller.signal)

      if (runId !== runIdRef.current) return

      // onReady fires when first chunk arrives — switch to ready immediately
      const onReady = (url) => {
        if (runId !== runIdRef.current) return
        audioUrlRef.current = url
        setAudioUrl(url)
        setPhase('ready')
      }

      await createStreamingUrl(response, onReady, controller.signal)
    } catch (error) {
      if (error.name === 'AbortError') return
      if (runId !== runIdRef.current) return
      setErrorSource(failedStep)
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.')
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

  return {
    phase,
    errorSource,
    errorMessage,
    script,
    audioBlob,
    audioUrl,
    retry: generate,
    title: getThemeLabel(answers.theme),
  }
}
