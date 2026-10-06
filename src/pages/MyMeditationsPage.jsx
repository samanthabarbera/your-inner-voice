import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMeditations, deleteMeditation } from '../lib/meditationLibrary'
import { THEMES, VOICES } from '../data/builderOptions'
import { CUSTOM_VOICE_OPTION_ID } from '../data/voiceRecording'
import MeditationPlayer from '../components/meditation/MeditationPlayer'
import Starburst from '../components/Starburst'
import { themeColor } from '../data/themeColors'

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
  if (voiceId === CUSTOM_VOICE_OPTION_ID) return 'Your voice'
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
        <div className="px-5 pt-4">
          <button
            type="button"
            onClick={() => setPlaying(null)}
            className="flex items-center gap-2 rounded-full bg-canvas-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-[#2A2A2E]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
            My Meditations
          </button>
        </div>
        <MeditationPlayer
          audioUrl={playing.audio_url}
          title={playing.title ?? getThemeLabel(playing.theme)}
          theme={playing.theme}
          meta={[playing.length && `${playing.length} min`, getVoiceName(playing.voice)].filter(Boolean).join(' · ')}
        />
      </div>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-5 py-6">
      <p className="text-base font-light text-ink-muted">Welcome back</p>
      <h1 className="mt-1 font-display text-3xl font-medium uppercase leading-none tracking-tight text-ink sm:text-4xl">
        My Meditations
      </h1>

      <div className="relative mt-6 flex flex-col gap-3 overflow-hidden rounded-[26px] bg-[#EDF23A] p-5 text-[#0B0B0C]">
        <div className="absolute right-4 top-4" aria-hidden="true">
          <Starburst size={44} showLines={false} color="#0B0B0C" />
        </div>
        <p className="max-w-[14rem] text-[22px] font-medium leading-tight">Make a new meditation</p>
        <p className="text-sm">Tell us where you are today. We&apos;ll write it for this moment.</p>
        <button
          type="button"
          onClick={() => navigate('/build')}
          className="flex items-center gap-2 self-start rounded-full bg-[#0B0B0C] px-5 py-3 text-[15px] font-medium text-white transition-transform active:scale-[0.97]"
        >
          Start
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>

      {loading && (
        <p className="mt-10 text-center text-ink-muted">Loading...</p>
      )}

      {error && (
        <p className="mt-6 rounded-2xl bg-[#FF9B4A] px-4 py-3 text-sm font-medium text-[#0B0B0C]">
          {error}
        </p>
      )}

      {!loading && !error && meditations.length === 0 && (
        <p className="mt-8 text-center text-base font-light text-ink-muted">
          You haven&apos;t saved any meditations yet.
        </p>
      )}

      {!loading && meditations.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-2.5">
          {meditations.map((m) => (
            <li
              key={m.id}
              className="rounded-3xl p-4 text-[#0B0B0C]"
              style={{ background: themeColor(m.theme) }}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => m.audio_url && setPlaying(m)}
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                  disabled={!m.audio_url}
                >
                  <span className="text-[13px]">
                    {[formatDate(m.saved_at), m.length && `${m.length} min`, getVoiceName(m.voice)].filter(Boolean).join(' · ')}
                  </span>
                  <span className="text-lg font-medium leading-tight">
                    {m.title ?? getThemeLabel(m.theme)}
                  </span>
                  {m.title && (
                    <span className="text-[13px] opacity-80">{getThemeLabel(m.theme)}</span>
                  )}
                  {!m.audio_url && (
                    <span className="text-xs opacity-70">Audio not available</span>
                  )}
                </button>

                {m.audio_url && (
                  <button
                    type="button"
                    onClick={() => setPlaying(m)}
                    aria-label="Play meditation"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B0B0C] text-white transition-transform active:scale-[0.97]"
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B0B0C]/10 text-[#0B0B0C] transition-colors hover:bg-[#0B0B0C]/20"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M5.5 6v4M8.5 6v4M3 3.5l.5 8a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5l.5-8" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
