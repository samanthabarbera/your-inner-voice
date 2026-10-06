import { useEffect, useState } from 'react'
import { useMeditationGeneration } from '../../hooks/useMeditationGeneration'
import { saveMeditationToCloud } from '../../lib/meditationLibrary'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../AuthModal'
import ContinueButton from '../builder/ContinueButton'
import MeditationLoadingScreen from './MeditationLoadingScreen'
import MeditationPlayer from './MeditationPlayer'
import SavePromptScreen from './SavePromptScreen'
import { VOICES } from '../../data/builderOptions'

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
  const { user } = useAuth()
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // When user signs in via the auth modal, attempt the save automatically
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false)
      performSave(user)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const performSave = async (currentUser) => {
    if (!audioBlob || !script || !currentUser) return

    setIsSaving(true)
    setSaveError(null)

    try {
      await saveMeditationToCloud(currentUser, {
        title,
        theme: answers.theme,
        length: answers.length,
        voice: answers.voice,
        customVoiceId: answers.customVoiceId,
        script,
      }, audioBlob)
      setIsSaved(true)
    } catch (err) {
      setSaveError(err.message ?? 'Could not save your meditation. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    performSave(user)
  }

  const voiceName = answers.customVoiceId && !VOICES.some((v) => v.id === answers.voice)
    ? 'Your voice'
    : VOICES.find((v) => v.id === answers.voice)?.name
  const playerMeta = [answers.length && `${answers.length} min`, voiceName].filter(Boolean).join(' · ')

  if (phase === 'writing') {
    return (
      <MeditationLoadingScreen
        title={title}
        theme={answers.theme}
        message="Writing your personalized script..."
      />
    )
  }

  if (phase === 'voicing') {
    return (
      <MeditationLoadingScreen
        title={title}
        theme={answers.theme}
        message="Recording your meditation in your chosen voice..."
      />
    )
  }

  if (phase === 'error') {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <div className="rounded-3xl bg-canvas-deep px-5 py-6">
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
              <p className="mt-3 text-sm font-medium text-[#FF9B4A]">{errorMessage}</p>
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
      <>
        <SavePromptScreen
          isSaved={isSaved}
          isSaving={isSaving}
          saveError={saveError}
          onSave={handleSave}
          onStartOver={onStartOver}
        />
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              // useEffect will fire when user state updates and call performSave
            }}
          />
        )}
      </>
    )
  }

  if (phase === 'ready' && audioUrl) {
    return (
      <MeditationPlayer
        audioUrl={audioUrl}
        title={title}
        theme={answers.theme}
        meta={playerMeta}
        onEnded={() => setShowSavePrompt(true)}
      />
    )
  }

  return (
    <MeditationLoadingScreen
      title={title}
      theme={answers.theme}
      message="Preparing your meditation..."
    />
  )
}
