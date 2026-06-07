import PlayButton from './PlayButton'

export default function VoiceOptionCard({
  isSelected,
  onSelect,
  onPlay,
  isPlayLoading,
  isPlaying,
  title,
  description,
  leading,
}) {
  return (
    <div
      className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-5 text-left transition-all duration-200 ${
        isSelected
          ? 'border-sage-dark bg-white/90 shadow-sm'
          : 'border-transparent bg-white/50 ring-1 ring-sage-dark/15 hover:bg-white/70 hover:ring-sage-dark/30'
      }`}
    >
      {leading ?? (
        <PlayButton isLoading={isPlayLoading} onClick={onPlay} />
      )}

      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left"
      >
        <p
          className={`text-lg font-medium ${isSelected ? 'text-ink' : 'text-ink-muted'}`}
        >
          {title}
          {isPlaying && !isPlayLoading && (
            <span className="ml-2 text-sm font-normal text-sage">Playing</span>
          )}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      </button>
    </div>
  )
}
