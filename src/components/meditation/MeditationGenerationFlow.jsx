import { useState } from 'react'
import { useMeditationGeneration } from '../../hooks/useMeditationGeneration'
import { saveMeditationToLibrary } from '../../lib/meditationLibrary'
import { blobToDataUrl } from '../../utils/audio'
import ContinueButton from '../builder/ContinueButton'
import MeditationLoadingScreen from './MeditationLoadingScreen'
import MeditationPlayer from './MeditationPlayer'
import SavePromptScreen from './SavePromptScreen'

export default function MeditationGenerationFlow({ answers, onStartOver }) {
  const {
    phase,
    errorSource,
    errorMessage,
    script,
    audioBlob,
    audioUrl,
    retry,
    title,
  } = useMeditationGeneration(answers)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!audioBlob || !script) return

    setIsSaving(true)

    try {
      const audioDataUrl = await blobToDataUrl(audioBlob)

      saveMeditationToLibrary({
        title,
        theme: answers.theme,
        length: answers.length,
        context: answers.context,
        voice: answers.voice,
        customVoiceId: answers.customVoiceId,
        script,
        audioDataUrl,
      })
      setIsSaved(true)
    } finally {
      setIsSaving(false)
    }
  }

  if (phase === 'writing') {
    return (
      <MeditationLoadingScreen
        title={title}
        message="Writing your personalized script..."
      />
    )
  }

  if (phase === 'voicing') {
    return (
      <MeditationLoadingScreen
        title={title}
        message="Recording your meditation in your chosen voice..."
      />
    )
  }

  if (phase === 'error') {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <div className="rounded-2xl border border-sage-dark/15 bg-white/70 px-5 py-6">
            <p className="text-lg leading-relaxed text-ink">
              We had trouble creating your meditation — want to try again?
            </p>
            {errorSource && (
              <p className="mt-2 text-sm text-ink-muted">
                {errorSource === 'claude'
                  ? 'The script could not be generated.'
                  : 'The audio could not be created.'}
              </p>
            )}
            {errorMessage && (
              <p className="mt-3 text-sm text-red-800">{errorMessage}</p>
            )}
          </div>
          <ContinueButton label="Try again" onClick={retry} />
          <button
            type="button"
            onClick={onStartOver}
            className="text-sm font-medium text-ink-muted underline-offset-2 hover:underline"
          >
            Start over
          </button>
        </div>
      </main>
    )
  }

  if (showSavePrompt) {
    return (
      <SavePromptScreen
        isSaved={isSaved}
        isSaving={isSaving}
        onSave={handleSave}
        onStartOver={onStartOver}
      />
    )
  }

  if (phase === 'ready' && audioUrl) {
    return (
      <MeditationPlayer
        audioUrl={audioUrl}
        title={title}
        onEnded={() => setShowSavePrompt(true)}
      />
    )
  }

  return (
    <MeditationLoadingScreen
      title={title}
      message="Preparing your meditation..."
    />
  )
}
