import { useState } from 'react'
import { CUSTOM_VOICE_OPTION_ID } from '../data/voiceRecording'
import { isVoiceStepComplete } from '../utils/voiceSelection'
import BuilderLayout from '../components/builder/BuilderLayout'
import ContinueButton from '../components/builder/ContinueButton'
import MeditationGenerationFlow from '../components/meditation/MeditationGenerationFlow'
import StepContext from '../components/builder/steps/StepContext'
import StepLength from '../components/builder/steps/StepLength'
import StepTheme from '../components/builder/steps/StepTheme'
import StepVoice from '../components/builder/steps/StepVoice'

const initialAnswers = {
  theme: null,
  context: '',
  length: null,
  voice: null,
  customVoiceId: null,
}

export default function BuilderFlow() {
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState(initialAnswers)
  const [isGenerating, setIsGenerating] = useState(false)

  const updateAnswer = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleVoiceSelect = (voiceId) => {
    setAnswers((prev) => ({
      ...prev,
      voice: voiceId,
      ...(voiceId !== CUSTOM_VOICE_OPTION_ID ? { customVoiceId: prev.customVoiceId } : {}),
    }))
  }

  const handleCustomVoiceReady = (elevenLabsVoiceId) => {
    setAnswers((prev) => ({
      ...prev,
      voice: CUSTOM_VOICE_OPTION_ID,
      customVoiceId: elevenLabsVoiceId,
    }))
  }

  const handleStartOver = () => {
    setIsGenerating(false)
    setStep(1)
    setAnswers(initialAnswers)
  }

  const canContinue = () => {
    switch (step) {
      case 1:
        return Boolean(answers.theme)
      case 2:
        return true
      case 3:
        return Boolean(answers.length)
      case 4:
        return isVoiceStepComplete(answers)
      default:
        return false
    }
  }

  const handleContinue = () => {
    if (!canContinue()) return

    if (step < 4) {
      setStep((prev) => prev + 1)
      return
    }

    setIsGenerating(true)
  }

  if (isGenerating) {
    return (
      <MeditationGenerationFlow
        answers={answers}
        onStartOver={handleStartOver}
      />
    )
  }

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <StepTheme
            selected={answers.theme}
            onSelect={(value) => updateAnswer('theme', value)}
          />
        )
      case 2:
        return (
          <StepContext
            value={answers.context}
            onChange={(value) => updateAnswer('context', value)}
          />
        )
      case 3:
        return (
          <StepLength
            selected={answers.length}
            onSelect={(value) => updateAnswer('length', value)}
          />
        )
      case 4:
        return (
          <StepVoice
            selected={answers.voice}
            customVoiceId={answers.customVoiceId}
            onSelect={handleVoiceSelect}
            onCustomVoiceReady={handleCustomVoiceReady}
          />
        )
      default:
        return null
    }
  }

  return (
    <BuilderLayout
      currentStep={step}
      footer={
        <ContinueButton onClick={handleContinue} disabled={!canContinue()} />
      }
    >
      {stepContent()}
    </BuilderLayout>
  )
}
