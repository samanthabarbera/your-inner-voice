import { useState } from 'react'
import { VOICES } from '../../../data/builderOptions'
import {
  CUSTOM_VOICE_OPTION_ID,
  OWN_VOICE_OPTION,
} from '../../../data/voiceRecording'
import { useVoicePreview } from '../../../hooks/useVoicePreview'
import VoiceCloneFlow from '../../voice-clone/VoiceCloneFlow'
import MicrophoneIcon from '../../voice-clone/MicrophoneIcon'
import VoiceOptionCard from '../VoiceOptionCard'


export default function StepVoice({
  selected,
  customVoiceId,
  onSelect,
  onCustomVoiceReady,
  accent = '#FFFFFF',
}) {
  const [showCloneFlow, setShowCloneFlow] = useState(false)

  const {
    playPreview,
    loadingVoiceId,
    playingVoiceId,
    previewError,
  } = useVoicePreview()

  const isCustomSelected = selected === CUSTOM_VOICE_OPTION_ID
  const hasCustomVoice = Boolean(customVoiceId)

  const handleOwnVoiceSelect = () => {
    if (hasCustomVoice) {
      onSelect(CUSTOM_VOICE_OPTION_ID)
      return
    }
    setShowCloneFlow(true)
  }

  const handleCloneComplete = (voiceId) => {
    onCustomVoiceReady(voiceId)
    setShowCloneFlow(false)
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <h2 className="font-display text-3xl font-medium uppercase leading-none tracking-tight text-ink sm:text-4xl">
          Choose a voice
        </h2>
        <p className="mt-3 font-light text-ink-muted">Select the voice that feels right for you.</p>

        {previewError && (
          <p className="mt-4 rounded-2xl bg-[#FF9B4A] px-4 py-3 text-sm font-medium text-[#0B0B0C]">
            {previewError}
          </p>
        )}

        <ul className="mt-7 flex flex-col gap-2.5">
          {VOICES.map((voice) => {
            const isSelected = selected === voice.id
            const isLoading = loadingVoiceId === voice.id
            const isPlaying = playingVoiceId === voice.id

            return (
              <li key={voice.id}>
                <VoiceOptionCard
                  isSelected={isSelected}
                  onSelect={() => onSelect(voice.id)}
                  onPlay={() => playPreview(voice)}
                  isPlayLoading={isLoading}
                  isPlaying={isPlaying}
                  title={voice.name}
                  description={voice.description}
                  accent={accent}
                />
              </li>
            )
          })}

          <li>
            <VoiceOptionCard
              isSelected={isCustomSelected}
              onSelect={handleOwnVoiceSelect}
              isPlayLoading={false}
              isPlaying={false}
              title={OWN_VOICE_OPTION.name}
              description={OWN_VOICE_OPTION.description}
              accent={accent}
              leading={
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    isCustomSelected
                      ? 'bg-[#0B0B0C] text-white'
                      : 'bg-white text-[#0B0B0C]'
                  }`}
                  aria-hidden="true"
                >
                  <MicrophoneIcon className="h-4 w-4" />
                </div>
              }
            />
          </li>
        </ul>

        {hasCustomVoice && (
          <button
            type="button"
            onClick={() => setShowCloneFlow(true)}
            className="mt-4 text-sm font-medium text-ink underline underline-offset-2"
          >
            Record your voice again
          </button>
        )}
      </div>

      {showCloneFlow && (
        <VoiceCloneFlow
          onComplete={handleCloneComplete}
          onClose={() => setShowCloneFlow(false)}
        />
      )}
    </>
  )
}
