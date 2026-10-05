import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMeditations, deleteMeditation } from '../lib/meditationLibrary'
import { THEMES, VOICES } from '../data/builderOptions'
import { CUSTOM_VOICE_OPTION_ID } from '../data/voiceRecording'
import MeditationPlayer from '../components/meditation/MeditationPlayer'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getThemeLabel(themeId) {
  return THEMES.find((t) => t.id === themeId)?.label ?? themeId
}

function getVoiceName(voiceId) {
  if (voiceId === CUSTOM_VOICE_OPTION_ID) return 'My Voice'
  return VOICES.find((v) => v.id === voiceId)?.name ?? voiceId
}

export default function MyMeditationsPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [meditations, setMeditations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playing, setPlaying] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (!user) return
    getMeditations()
      .then(setMeditations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  const handleDelete = async (id) => {
    try {
      await deleteMeditation(id)
      setMeditations((prev) => prev.filter((m) => m.id !== id))
      if (playing?.id === id) setPlaying(null)
    } catch (err) {
      setError(err.message)
    }
  }

  if (playing) {
    return (
      <div>
        <div className="px-6 pt-4">
          <button
            type="button"
            onClick={() => setPlaying(null)}
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            ← My Meditations
          </button>
        </div>
        <MeditationPlayer
          audioUrl={playing.audio_url}
          title={playing.title ?? getThemeLabel(playing.theme)}
        />
      </div>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-6 py-8">
      <h1 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
        My Meditations
      </h1>

      {loading && (
        <p className="mt-10 text-center text-ink-muted">Loading...</p>
      )}

      {error && (
        <p className="mt-10 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!loading && !error && meditations.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-6 text-center">
          <p className="text-base text-ink-muted">
            You haven&apos;t saved any meditations yet.
          </p>
          <button
            type="button"
            onClick={() => navigate('/build')}
            className="rounded-full bg-[#FF4E6A] px-8 py-3.5 text-base font-medium text-white shadow-sm transition-colors hover:bg-[#e63f5a] active:scale-[0.97] active:brightness-90"
          >
            Build my meditation
          </button>
        </div>
      )}

      {!loading && meditations.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3">
          {meditations.map((m) => (
            <li
              key={m.id}
              className="group rounded-2xl border border-ink/10 bg-canvas-deep px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <button
                  type="button"
                  onClick={() => m.audio_url && setPlaying(m)}
                  className="flex flex-1 flex-col gap-1 text-left"
                  disabled={!m.audio_url}
                >
                  <span className="font-display text-lg font-medium text-ink">
                    {m.title ?? getThemeLabel(m.theme)}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {getThemeLabel(m.theme)}
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-ink/8 px-3 py-0.5 text-xs font-medium text-ink-muted">
                      {m.length} min
                    </span>
                    <span className="rounded-full bg-ink/8 px-3 py-0.5 text-xs font-medium text-ink-muted">
                      {getVoiceName(m.voice)}
                    </span>
                    <span className="rounded-full bg-ink/8 px-3 py-0.5 text-xs font-medium text-ink-muted">
                      {formatDate(m.saved_at)}
                    </span>
                  </div>
                  {!m.audio_url && (
                    <span className="mt-1 text-xs text-ink-muted/60">Audio not available</span>
                  )}
                </button>

                <div className="flex items-center gap-3 pt-1">
                  {m.audio_url && (
                    <button
                      type="button"
                      onClick={() => setPlaying(m)}
                      aria-label="Play meditation"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF4E6A] text-white shadow-sm transition-colors hover:bg-[#e63f5a] active:scale-[0.97] active:brightness-90"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                        <path d="M3 1.5v11l8.5-5.5L3 1.5z" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    aria-label="Delete meditation"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted/40 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M5.5 6v4M8.5 6v4M3 3.5l.5 8a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5l.5-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
