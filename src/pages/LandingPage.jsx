import { Link, useNavigate } from 'react-router-dom'
import Starburst from '../components/Starburst'

if (typeof document !== 'undefined' && !document.getElementById('landing-style')) {
  const s = document.createElement('style')
  s.id = 'landing-style'
  s.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes burstIn {
      from { opacity: 0; transform: scale(0.85) rotate(-12deg); }
      to   { opacity: 1; transform: scale(1) rotate(0deg); }
    }
  `
  document.head.appendChild(s)
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden px-6 pb-10 pt-4">
      <div
        aria-hidden="true"
        className="pointer-events-none flex flex-1 items-center justify-center"
        style={{ minHeight: '42svh', animation: 'burstIn 0.9s cubic-bezier(0.2,0.7,0.3,1) both' }}
      >
        <div className="animate-starburst">
          <Starburst size={360} />
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-5" style={{ zIndex: 10 }}>
        <h1
          className="m-0 font-display text-5xl font-medium uppercase leading-none tracking-tight text-ink sm:text-6xl"
          style={{ animation: 'fadeUp 0.7s ease both' }}
        >
          Your
          <br />
          Inner Voice
        </h1>
        <p
          className="max-w-xs text-lg font-light leading-relaxed text-ink-muted"
          style={{ animation: 'fadeUp 0.7s ease 0.15s both' }}
        >
          A meditation made for your exact moment — in a voice you choose, even your own.
        </p>
        <button
          type="button"
          onClick={() => navigate('/build')}
          className="btn-press mt-2 w-full rounded-full px-8 py-4 text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{ animation: 'fadeUp 0.7s ease 0.3s both' }}
        >
          Build my meditation
        </button>
        <Link
          to="/privacy"
          className="self-center text-xs font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          style={{ animation: 'fadeUp 0.7s ease 0.45s both' }}
        >
          Privacy
        </Link>
      </div>
    </main>
  )
}
