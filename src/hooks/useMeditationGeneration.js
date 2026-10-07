import { useCallback, useEffect, useRef, useState } from 'react'
import { generateMeditationScript } from '../lib/anthropic'
import { streamFullAudio } from '../lib/elevenlabs'
import { getThemeLabel } from '../utils/builderAnswers'
import { getElevenLabsVoiceId } from '../utils/voiceSelection'

/**
 * Pipes a streaming /api/stream-audio Response into a playable URL.
 *
 * With MediaSource support (Chrome, desktop Safari, Firefox) playback can start
 * as soon as the first MP3 bytes arrive. Note: a MediaSource only fires
 * `sourceopen` once its object URL is attached to an <audio> element, so we
 * must hand the URL to the player (onFirstChunk) BEFORE waiting on sourceopen —
 * waiting first deadlocks (the player never mounts, sourceopen never fires).
 *
 * Without MediaSource (e.g. iPhone Safari) we buffer the whole stream into a Blob.
 *
 * Resolves to { url, blob } once the full audio has been received.
 */
async function streamToMediaSource(response, onFirstChunk, signal) {
  const allChunks = []
  const reader = response.body.getReader()

  const readNext = async () => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    return reader.read()
  }

  const canStream =
    typeof window !== 'undefined' &&
    window.MediaSource &&
    MediaSource.isTypeSupported('audio/mpeg')

  if (!canStream) {
    while (true) {
      const { done, value } = await readNext()
      if (done) break
      allChunks.push(value)
    }
    const blob = new Blob(allChunks, { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    onFirstChunk(url, blob)
    return { url, blob }
  }

  // Wait for the first bytes so the player appears only when there's audio to play.
  const first = await readNext()
  if (first.done) throw new Error('The audio stream was empty.')
  allChunks.push(first.value)

  const ms = new MediaSource()
  const url = URL.createObjectURL(ms)

  return new Promise((resolve, reject) => {
    const queue = [first.value]
    let streamDone = false
    let finished = false
    let sb = null

    const finish = () => {
      if (finished) return
      finished = true
      resolve({ url, blob: new Blob(allChunks, { type: 'audio/mpeg' }) })
    }

    const pump = () => {
      if (!sb || sb.updating) return
      if (queue.length > 0) {
        try {
          sb.appendBuffer(queue.shift())
        } catch (e) {
          reject(e)
        }
        return
      }
      if (streamDone) {
        if (ms.readyState === 'open') {
          try { ms.endOfStream() } catch { /* ignore */ }
        }
        finish()
      }
    }

    ms.addEventListener('sourceopen', () => {
      if (sb) return
      try {
        sb = ms.addSourceBuffer('audio/mpeg')
      } catch (e) {
        reject(e)
        return
      }
      sb.addEventListener('updateend', pump)
      pump()
    }, { once: true })

    // Hand the URL to the player now — attaching it is what opens the MediaSource.
    onFirstChunk(url, null)

    ;(async () => {
      try {
        while (true) {
          const { done, value } = await readNext()
          if (done) { streamDone = true; pump(); break }
          allChunks.push(value)
          queue.push(value)
          pump()
        }
      } catch (e) {
        if (e?.name !== 'AbortError') reject(e)
      }
    })()
  })
}

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
        { theme: answers.theme, situation: answers.context, length: answers.length },
        controller.signal,
      )

      if (runId !== runIdRef.current) return

      setScript(cleanedScript)
      setPhase('voicing')
      failedStep = 'elevenlabs'

      const voiceId = getElevenLabsVoiceId(answers)
      if (!voiceId) throw new Error('No voice selected.')

      const response = await streamFullAudio(voiceId, cleanedScript, controller.signal, answers.length)

      if (runId !== runIdRef.current) return

      // Called when first audio chunk is buffered — switch to ready early
      const onFirstChunk = (url, partialBlob) => {
        if (runId !== runIdRef.current) return
        audioUrlRef.current = url
        setAudioUrl(url)
        if (partialBlob) setAudioBlob(partialBlob)
        setPhase('ready')
      }

      // Stream everything; update blob when complete
      const { blob: finalBlob } = await streamToMediaSource(response, onFirstChunk, controller.signal)

      if (runId !== runIdRef.current) return
      // Update blob to full audio for saving
      setAudioBlob(finalBlob)
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
