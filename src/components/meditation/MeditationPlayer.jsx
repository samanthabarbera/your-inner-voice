import { useEffect, useRef } from 'react'
import musicSrc from '../../assets/music/SO_AM_114_melodic_loop_krishna_Cmaj.wav'
import { useAudioPlayer, formatTime } from '../../hooks/useAudioPlayer'
import { themeColor } from '../../data/themeColors'
import Starburst from '../Starburst'
import PlaybackWaveform from './PlaybackWaveform'

const MUSIC_VOLUME = 0.18
const SEGMENTS = 8 // mirrors the eight-part meditation structure

export default function MeditationPlayer({ audioUrl, title, theme, meta, onEnded }) {
  const {
    isPlaying,
    currentTime,
    duration,
    progress,
    waveformLevels,
    togglePlayback,
    seek,
  } = useAudioPlayer(audioUrl, { autoPlay: true, onEnded })

  const color = themeColor(theme)

  // Background music — loops quietly, follows voice play/pause state
  const musicRef = useRef(null)
  useEffect(() => {
    const music = new Audio(musicSrc)
    music.loop = true
    music.volume = MUSIC_VOLUME
    musicRef.current = music
    return () => {
      music.pause()
      musicRef.current = null
    }
  }, [])

  useEffect(() => {
    const music = musicRef.current
    if (!music) return
    if (isPlaying) {
      music.play().catch(() => {})
    } else {
      music.pause()
    }
  }, [isPlaying])

  function handleProgressClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    seek((e.clientX - rect.left) / rect.width)
  }

  function skip(seconds) {
    if (!duration) return
    const next = Math.max(0, Math.min(duration, currentTime + seconds))
    seek(next / duration)
  }

  return (
    <main className="relative flex min-h-svh flex-col px-5 py-10">
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <p className="text-center text-sm font-medium uppercase tracking-[0.14em] text-ink-muted">
          Now playing
        </p>

        <div
          className="relative mt-6 flex min-h-80 flex-col justify-end gap-1.5 overflow-hidden rounded-[30px] p-6 text-[#0B0B0C]"
          style={{ background: color }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2"
          >
            <div
              className="animate-starburst"
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            >
              <Starburst size={200} color="#0B0B0C" lines="#0B0B0C" />
            </div>
          </div>
          {meta && (
            <p className="relative text-sm font-medium uppercase tracking-[0.1em]">{meta}</p>
          )}
          <h1 className="relative font-display text-3xl font-medium uppercase leading-none tracking-tight sm:text-4xl">
            {title}
          </h1>
        </div>

        <div className="mt-6">
          <PlaybackWaveform levels={waveformLevels} isActive={isPlaying} color={color} />
        </div>

        <div className="mt-4">
          <div
            className="flex h-6 w-full cursor-pointer items-center gap-1"
            role="slider"
            tabIndex={0}
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Meditation progress"
            onClick={handleProgressClick}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') skip(15)
              if (e.key === 'ArrowLeft') skip(-15)
            }}
          >
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const fill = Math.max(0, Math.min(1, progress * SEGMENTS - i))
              return (
                <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas-raised">
                  <div className="h-full rounded-full" style={{ width: `${fill * 100}%`, background: color }} />
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-sm tabular-nums text-ink-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="mt-10 flex items-center justify-center gap-7">
          <button
            type="button"
            onClick={() => skip(-15)}
            aria-label="Back 15 seconds"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas-raised text-sm font-medium text-ink transition-colors hover:bg-[#2A2A2E] active:scale-[0.97]"
          >
            −15
          </button>
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pause meditation' : 'Play meditation'}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0B0B0C] transition-colors hover:bg-[#E9E9EC] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                <rect x="3" y="2" width="4" height="14" rx="1.2" />
                <rect x="11" y="2" width="4" height="14" rx="1.2" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                <path d="M4 2.5v13l10.5-6.5L4 2.5z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => skip(15)}
            aria-label="Forward 15 seconds"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas-raised text-sm font-medium text-ink transition-colors hover:bg-[#2A2A2E] active:scale-[0.97]"
          >
            +15
          </button>
        </div>
      </div>
    </main>
  )
}
