import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getEnabledProviders } from '../lib/authProviders'
import Logo from '../components/Logo'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [googleEnabled, setGoogleEnabled] = useState(false)

  useEffect(() => {
    let alive = true
    getEnabledProviders().then((p) => { if (alive) setGoogleEnabled(Boolean(p.google)) })
    return () => { alive = false }
  }, [])
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        setSuccessMessage('Check your email to confirm your account, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/my-meditations' },
    })
    if (error) setError(error.message)
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
        </div>

        {successMessage ? (
          <div className="rounded-3xl bg-canvas-deep px-5 py-5 text-center">
            <p className="text-base text-ink">{successMessage}</p>
            <button
              type="button"
              onClick={() => { setSuccessMessage(null); setMode('signin') }}
              className="mt-4 text-sm font-medium text-ink underline underline-offset-2"
            >
              Sign in
            </button>
          </div>
        ) : (
          <>
            {googleEnabled && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-canvas-raised px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-[#2A2A2E]"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-ink/10" />
                <span className="text-xs text-ink-muted">or</span>
                <div className="h-px flex-1 bg-ink/10" />
              </div>
            </>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-ink">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="rounded-2xl border-2 border-white/12 bg-canvas-deep px-4 py-3.5 text-sm text-ink placeholder-ink-muted/60 outline-none focus:border-white"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-ink">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="rounded-2xl border-2 border-white/12 bg-canvas-deep px-4 py-3.5 text-sm text-ink placeholder-ink-muted/60 outline-none focus:border-white"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-2xl bg-[#FF9B4A] px-4 py-3 text-sm font-medium text-[#0B0B0C]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-white px-8 py-4 text-base font-medium text-[#0B0B0C] transition-colors hover:bg-[#E9E9EC] active:scale-[0.97] disabled:opacity-60"
              >
                {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-ink-muted">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null) }}
                    className="font-medium text-ink underline underline-offset-2"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null) }}
                    className="font-medium text-ink underline underline-offset-2"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-center text-sm text-ink-muted underline-offset-2 hover:underline"
        >
          ← Back to home
        </button>
      </div>
    </main>
  )
}
