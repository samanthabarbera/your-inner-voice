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
const POP_COLORS = ['#FF4E6A', '#00C2C8', '#FF4E6A']


export default function StepVoice({
  selected,
  customVoiceId,
  onSelect,
  onCustomVoiceReady,
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
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          Choose a voice
        </h2>
        <p className="mt-2 text-ink-muted">Select the voice that feels right for you.</p>

        {previewError && (
          <p className="mt-4 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-800">
            {previewError}
          </p>
        )}

        <ul className="mt-8 flex flex-col gap-3">
          {VOICES.map((voice, i) => {
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
                  popColor={POP_COLORS[i % POP_COLORS.length]}
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
              leading={
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    isCustomSelected
                      ? 'border-white/30 bg-white/10 text-ink'
                      : 'border-white/15 bg-white/8 text-ink'
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
