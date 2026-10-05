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
  popColor = '#FF4E6A',
}) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onSelect() : null}
      style={isSelected
        ? { background: popColor, borderColor: popColor }
        : { borderLeftColor: popColor, borderLeftWidth: '4px' }
      }
      className={`card-press${isSelected ? ' card-selected' : ''} flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 px-5 py-5 text-left ${
        isSelected
          ? ''
          : 'border-white/10 bg-white/8'
      }`}
    >
      {leading ?? (
        <PlayButton isLoading={isPlayLoading} onClick={() => onPlay()} isSelected={isSelected} />
      )}

      <div className="min-w-0 flex-1 text-left">
        <p className={`text-lg font-medium ${isSelected ? 'text-white' : 'text-ink'}`}>
          {title}
          {isPlaying && !isPlayLoading && (
            <span className={`ml-2 text-sm font-normal ${isSelected ? 'text-white/70' : 'text-ink-muted'}`}>Playing</span>
          )}
        </p>
        <p className={`mt-0.5 text-sm ${isSelected ? 'text-white/70' : 'text-ink-muted'}`}>{description}</p>
      </div>
    </div>
  )
}
