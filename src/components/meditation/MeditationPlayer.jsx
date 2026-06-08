import { useAudioPlayer, formatTime } from '../../hooks/useAudioPlayer'
import PlaybackWaveform from './PlaybackWaveform'

export default function MeditationPlayer({ audioUrl, title, onEnded }) {
  const {
    isPlaying,
    currentTime,
    duration,
    progress,
    waveformLevels,
    togglePlayback,
    seek,
  } = useAudioPlayer(audioUrl, { autoPlay: true, onEnded })

  function handleProgressClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    seek((e.clientX - rect.left) / rect.width)
  }

  return (
    <main className="flex min-h-svh flex-col px-6 py-12">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <header className="mb-10 text-center">
          <p className="text-sm font-medium tracking-wide text-ink-muted">
            Your meditation
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
        </header>

        <PlaybackWaveform levels={waveformLevels} isActive={isPlaying} />

        <div className="mt-8">
          <div
            className="h-6 w-full cursor-pointer flex items-center"
            role="slider"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Meditation progress"
            onClick={handleProgressClick}
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-sage-dark/15">
              <div
                className="h-full rounded-full bg-sage-dark transition-[width] duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-sm tabular-nums text-ink-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pause meditation' : 'Play meditation'}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-dark text-white shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                <rect x="3" y="2" width="4" height="14" rx="1" />
                <rect x="11" y="2" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                <path d="M4 2.5v13l10.5-6.5L4 2.5z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
