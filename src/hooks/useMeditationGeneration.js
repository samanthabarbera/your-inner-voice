import { useCallback, useEffect, useRef, useState } from 'react'
import { generateMeditationScript } from '../lib/anthropic'
import { streamFullAudio } from '../lib/elevenlabs'
import { getThemeLabel } from '../utils/builderAnswers'
import { getElevenLabsVoiceId } from '../utils/voiceSelection'

/**
 * Pipes a streaming /api/stream-audio Response into a MediaSource object URL.
 * Calls onFirstChunk(url) as soon as the first MP3 bytes arrive so the player
 * can start before the full audio is downloaded.
 *
 * Returns a Promise that resolves to the same objectURL once streaming is complete,
 * and also collects a Blob of the full audio for saving.
 */
async function streamToMediaSource(response, onFirstChunk, signal) {
  // Collect chunks for later saving
  const allChunks = []

  if (!window.MediaSource || !MediaSource.isTypeSupported('audio/mpeg')) {
    // Fallback: buffer everything then hand back a blob URL
    const reader = response.body.getReader()
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const { done, value } = await reader.read()
      if (done) break
      allChunks.push(value)
    }
    const blob = new Blob(allChunks, { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    onFirstChunk(url, blob)
    return { url, blob }
  }

  return new Promise((resolve, reject) => {
    const ms = new MediaSource()
    const url = URL.createObjectURL(ms)
    let sb
    let firstChunkFired = false
    const queue = []
    let appending = false
    let streamDone = false

    const tryAppend = () => {
      if (appending || queue.length === 0 || sb.updating) return
      appending = true
      const chunk = queue.shift()
      try {
        sb.appendBuffer(chunk)
      } catch {
        appending = false
      }
    }

    const tryEnd = () => {
      if (streamDone && queue.length === 0 && !sb.updating && ms.readyState === 'open') {
        try { ms.endOfStream() } catch { /* ignore */ }
        const blob = new Blob(allChunks, { type: 'audio/mpeg' })
        resolve({ url, blob })
      }
    }

    ms.addEventListener('sourceopen', async () => {
      try {
        sb = ms.addSourceBuffer('audio/mpeg')
      } catch {
        URL.revokeObjectURL(url)
        // Fallback to blob
        const reader = response.body.getReader()
        while (true) {
          if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return }
          const { done, value } = await reader.read()
          if (done) break
          allChunks.push(value)
        }
        const blob = new Blob(allChunks, { type: 'audio/mpeg' })
        const blobUrl = URL.createObjectURL(blob)
        onFirstChunk(blobUrl, blob)
        resolve({ url: blobUrl, blob })
        return
      }

      sb.addEventListener('updateend', () => {
        appending = false
        if (!firstChunkFired && allChunks.length > 0) {
          firstChunkFired = true
          const partialBlob = new Blob(allChunks, { type: 'audio/mpeg' })
          onFirstChunk(url, partialBlob)
        }
        tryAppend()
        tryEnd()
      })

      try {
        const reader = response.body.getReader()
        while (true) {
          if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return }
          const { done, value } = await reader.read()
          if (done) { streamDone = true; tryEnd(); break }
          allChunks.push(value)
          queue.push(value)
          tryAppend()
        }
      } catch (e) {
        if (!signal?.aborted) reject(e)
      }
    })
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

      const response = await streamFullAudio(voiceId, cleanedScript, controller.signal)

      if (runId !== runIdRef.current) return

      // Called when first audio chunk is buffered — switch to ready early
      const onFirstChunk = (url, partialBlob) => {
        if (runId !== runIdRef.current) return
        audioUrlRef.current = url
        setAudioUrl(url)
        setAudioBlob(partialBlob)
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
