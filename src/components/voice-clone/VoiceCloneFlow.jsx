import { useCallback, useEffect, useRef, useState } from 'react'
import { createInstantVoiceClone } from '../../lib/elevenlabs'
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { useVoicePreview } from '../../hooks/useVoicePreview'
import {
  CUSTOM_VOICE_CONFIRMATION_TEXT,
  RECORDING_MAX_SECONDS,
  RECORDING_MIN_SECONDS,
} from '../../data/voiceRecording'
import ContinueButton from '../builder/ContinueButton'
import PlayButton from '../builder/PlayButton'
import MicrophoneIcon from './MicrophoneIcon'
import RecordingWaveform from './RecordingWaveform'

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function CloneLayout({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f4f6f2]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-8">
        <button
          type="button"
          onClick={onClose}
          className="mb-6 self-start text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          ← Back
        </button>
        <div className="flex flex-1 flex-col justify-center">{children}</div>
      </div>
    </div>
  )
}

function LoadingPulse() {
  return (
    <div className="relative mx-auto flex h-20 w-20 items-center justify-center" aria-hidden="true">
      <span className="absolute inline-flex h-16 w-16 animate-pulse-soft rounded-full bg-sage-dark/10" />
      <span className="absolute inline-flex h-11 w-11 animate-pulse-soft rounded-full bg-sage-dark/20 [animation-delay:0.4s]" />
      <span className="relative inline-flex h-6 w-6 rounded-full bg-sage-dark/40 animate-pulse-soft [animation-delay:0.8s]" />
    </div>
  )
}

export default function VoiceCloneFlow({ onComplete, onClose }) {
  const [step, setStep] = useState('instructions')
  const [clonedVoiceId, setClonedVoiceId] = useState(null)
  const cloningRef = useRef(false)

  const {
    isRecording,
    elapsedSeconds,
    audioBlob,
    waveformLevels,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder()

  const {
    playPreviewByVoiceId,
    loadingVoiceId,
    playingVoiceId,
    previewError,
    stopPreview,
  } = useVoicePreview()

  const canStopRecording =
    isRecording && elapsedSeconds >= RECORDING_MIN_SECONDS
  const showStopHint =
    isRecording && elapsedSeconds >= RECORDING_MAX_SECONDS

  const runClone = useCallback(async (blob) => {
    setStep('processing')

    const controller = new AbortController()

    try {
      const voiceId = await createInstantVoiceClone(blob, controller.signal)
      setClonedVoiceId(voiceId)
      setStep('confirmation')
    } catch {
      setStep('error')
    }
  }, [])

  useEffect(() => {
    if (!audioBlob || step !== 'recording' || cloningRef.current) return
    cloningRef.current = true
    runClone(audioBlob)
  }, [audioBlob, runClone, step])

  useEffect(() => () => stopPreview(), [stopPreview])

  const handleRetry = () => {
    cloningRef.current = false
    resetRecording()
    setClonedVoiceId(null)
    setStep('recording')
  }

  const handleDone = () => {
    if (clonedVoiceId) {
      onComplete(clonedVoiceId)
    }
  }

  if (step === 'instructions') {
    return (
      <CloneLayout onClose={onClose}>
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
              Record your voice
            </h2>
            <p className="mt-2 text-ink-muted">
              We&apos;ll use a short sample to create your personal voice profile.
            </p>
          </div>

          <div className="rounded-2xl border border-sage-dark/15 bg-white/70 px-5 py-5 text-base leading-relaxed text-ink-muted">
            We&apos;ll create a voice profile from a short recording. Speak naturally
            for about 45 seconds — you can read anything, just talk normally. The
            better the recording, the better your meditation will sound.
          </div>

          <ContinueButton
            label="Continue"
            onClick={() => setStep('recording')}
          />
        </div>
      </CloneLayout>
    )
  }

  if (step === 'recording') {
    return (
      <CloneLayout onClose={onClose}>
        <div className="flex flex-col items-center gap-8 text-center">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
              {isRecording ? 'Recording...' : 'Ready when you are'}
            </h2>
            <p className="mt-2 text-ink-muted">
              {isRecording
                ? `Speak naturally (${RECORDING_MIN_SECONDS}–${RECORDING_MAX_SECONDS} seconds)`
                : 'Tap the microphone to begin'}
            </p>
          </div>

          <p className="font-mono text-4xl font-medium tabular-nums text-ink">
            {formatTime(elapsedSeconds)}
          </p>

          <RecordingWaveform levels={waveformLevels} isActive={isRecording} />

          <button
            type="button"
            onClick={isRecording ? undefined : startRecording}
            disabled={isRecording}
            aria-label={isRecording ? 'Recording in progress' : 'Start recording'}
            className={`flex h-28 w-28 items-center justify-center rounded-full border-2 transition-all duration-200 ${
              isRecording
                ? 'border-sage-dark bg-sage-dark text-white shadow-md'
                : 'border-sage-dark/25 bg-white/90 text-sage-dark hover:border-sage-dark/50 hover:bg-white'
            }`}
          >
            <MicrophoneIcon className="h-10 w-10" />
          </button>

          {(recorderError || previewError) && (
            <p className="text-sm text-red-800">{recorderError || previewError}</p>
          )}

          {isRecording && (
            <div className="flex w-full flex-col gap-3">
              {showStopHint && (
                <p className="text-sm text-ink-muted">
                  You&apos;ve reached {RECORDING_MAX_SECONDS} seconds — ready to continue?
                </p>
              )}
              <ContinueButton
                label="Stop and continue"
                onClick={stopRecording}
                disabled={!canStopRecording}
              />
              {!canStopRecording && (
                <p className="text-sm text-ink-muted">
                  Keep going for at least {RECORDING_MIN_SECONDS} seconds
                </p>
              )}
            </div>
          )}
        </div>
      </CloneLayout>
    )
  }

  if (step === 'processing') {
    return (
      <CloneLayout onClose={onClose}>
        <div className="flex flex-col items-center gap-8 text-center">
          <LoadingPulse />
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
              Creating your voice profile...
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              This usually takes just a few seconds.
            </p>
          </div>
        </div>
      </CloneLayout>
    )
  }

  if (step === 'error') {
    return (
      <CloneLayout onClose={onClose}>
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="rounded-2xl border border-sage-dark/15 bg-white/70 px-5 py-6">
            <p className="text-lg leading-relaxed text-ink">
              We had trouble capturing your voice — want to try again?
            </p>
          </div>
          <ContinueButton label="Try again" onClick={handleRetry} />
        </div>
      </CloneLayout>
    )
  }

  if (step === 'confirmation' && clonedVoiceId) {
    const previewTrackId = 'custom-clone-preview'
    const isPreviewLoading = loadingVoiceId === previewTrackId
    const isPreviewPlaying = playingVoiceId === previewTrackId

    return (
      <CloneLayout onClose={onClose}>
        <div className="flex flex-col items-center gap-8 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-sage-dark bg-white/90 text-sage-dark"
            aria-hidden="true"
          >
            <MicrophoneIcon className="h-7 w-7" />
          </div>

          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
              Your voice is ready
            </h2>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-ink-muted">
              {CUSTOM_VOICE_CONFIRMATION_TEXT}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-sage-dark/15 bg-white/70 px-5 py-4">
            <PlayButton
              isLoading={isPreviewLoading}
              onClick={() =>
                playPreviewByVoiceId(
                  clonedVoiceId,
                  previewTrackId,
                  CUSTOM_VOICE_CONFIRMATION_TEXT,
                )
              }
            />
            <span className="text-sm text-ink-muted">
              {isPreviewPlaying ? 'Playing preview' : 'Preview your voice'}
            </span>
          </div>

          {previewError && (
            <p className="text-sm text-red-800">{previewError}</p>
          )}

          <ContinueButton label="Use this voice" onClick={handleDone} />
        </div>
      </CloneLayout>
    )
  }

  return null
}
