import PlayButton from './PlayButton'
import CheckBadge from './CheckBadge'

export default function VoiceOptionCard({
  isSelected,
  onSelect,
  onPlay,
  isPlayLoading,
  isPlaying,
  title,
  description,
  leading,
  accent = '#FFFFFF',
}) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? onSelect() : null)}
      style={isSelected ? { background: accent } : undefined}
      className={`card-press${isSelected ? ' card-selected' : ''} flex w-full cursor-pointer items-center gap-4 rounded-3xl px-5 py-4 text-left ${
        isSelected ? 'text-[#0B0B0C]' : 'bg-canvas-deep text-ink'
      }`}
    >
      {leading ?? (
        <PlayButton isLoading={isPlayLoading} onClick={() => onPlay()} isSelected={isSelected} />
      )}

      <div className="min-w-0 flex-1 text-left">
        <p className="text-lg font-medium">
          {title}
          {isPlaying && !isPlayLoading && (
            <span className={`ml-2 text-sm font-normal ${isSelected ? 'text-[#0B0B0C]/75' : 'text-ink-muted'}`}>Playing</span>
          )}
        </p>
        <p className={`mt-0.5 text-sm font-light ${isSelected ? 'text-[#0B0B0C]/80' : 'text-ink-muted'}`}>{description}</p>
      </div>

      {isSelected && <CheckBadge color={accent} />}
    </div>
  )
}
