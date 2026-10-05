import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import Logo from '../components/Logo'
import { useRipple } from '../hooks/useRipple'

if (typeof document !== 'undefined' && !document.getElementById('landing-style')) {
  const s = document.createElement('style')
  s.id = 'landing-style'
  s.textContent = `
    @keyframes waveOut {
      0%   { transform: scale(0); opacity: 0.7; }
      15%  { opacity: 0.45; }
      100% { transform: scale(1); opacity: 0; }
    }
    @keyframes blobDrift1 {
      0%   { transform: translate(0px, 0px) scale(1); }
      33%  { transform: translate(-40px, 60px) scale(1.1); }
      66%  { transform: translate(30px, -40px) scale(0.95); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    @keyframes blobDrift2 {
      0%   { transform: translate(0px, 0px) scale(1); }
      33%  { transform: translate(50px, -50px) scale(1.08); }
      66%  { transform: translate(-30px, 40px) scale(0.94); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    @keyframes liquidMorph {
      0%   { border-radius: 50%; transform: scale(1) rotate(0deg); }
      20%  { border-radius: 60% 40% 55% 45% / 45% 55% 40% 60%; transform: scale(1.06) rotate(18deg); }
      40%  { border-radius: 40% 60% 45% 55% / 60% 40% 55% 45%; transform: scale(0.96) rotate(36deg); }
      60%  { border-radius: 55% 45% 60% 40% / 40% 60% 45% 55%; transform: scale(1.08) rotate(54deg); }
      80%  { border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%; transform: scale(0.97) rotate(72deg); }
      100% { border-radius: 50%; transform: scale(1) rotate(0deg); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
  document.head.appendChild(s)
}

function spawnWaterRipple(container, x, y) {
  const waves = [
    { delay: 0,   size: 80,  dur: 1800, op: 0.55 },
    { delay: 180, size: 240, dur: 2300, op: 0.38 },
    { delay: 380, size: 460, dur: 2800, op: 0.25 },
    { delay: 600, size: 700, dur: 3300, op: 0.15 },
  ]
  waves.forEach(({ delay, size, dur, op }) => {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    el.style.width = size + 'px'
    el.style.height = size + 'px'
    el.style.marginLeft = (-size / 2) + 'px'
    el.style.marginTop = (-size / 2) + 'px'
    el.style.borderRadius = '50%'
    el.style.border = `1px solid rgba(190,235,242,${op})`
    el.style.background = `radial-gradient(ellipse at center, transparent 60%, rgba(190,235,242,${op * 0.25}) 78%, transparent 100%)`
    el.style.pointerEvents = 'none'
    el.style.zIndex = '15'
    el.style.animation = `waveOut ${dur}ms cubic-bezier(0.2,0.5,0.3,1) ${delay}ms forwards`
    container.appendChild(el)
    setTimeout(() => el.remove(), dur + delay + 100)
  })
}

export default function LandingPage() {
  const navigate = useNavigate()
  const mainRef = useRef(null)
  const buttonRipple = useRipple('rgba(232,248,248,0.4)')

  const handleTap = (e) => {
    if (e.target.closest('button, input, select, textarea')) return
    const el = mainRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    spawnWaterRipple(el, x, y)
  }

  return (
    <main
      ref={mainRef}
      onClick={handleTap}
      onTouchStart={handleTap}
      className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center overflow-hidden"
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
        <div style={{
          position: 'absolute', width: '420px', height: '420px',
          top: '50%', left: '50%', marginLeft: '-210px', marginTop: '-210px',
          background: 'radial-gradient(ellipse, rgba(0,80,95,0.45) 0%, transparent 70%)',
          animation: 'liquidMorph 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '500px', height: '400px',
          top: '-80px', right: '-80px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,78,106,0.3) 0%, transparent 70%)',
          animation: 'blobDrift1 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '450px', height: '380px',
          bottom: '-60px', left: '-80px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,194,200,0.25) 0%, transparent 70%)',
          animation: 'blobDrift2 13s ease-in-out infinite',
        }} />
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center gap-10" style={{ zIndex: 10 }}>
        <div style={{ animation: 'fadeUp 0.7s ease both' }}>
          <Logo />
        </div>
        <p
          className="max-w-sm text-lg leading-relaxed text-ink-muted sm:text-xl"
          style={{ animation: 'fadeUp 0.7s ease 0.15s both' }}
        >
          A meditation made for your exact moment
        </p>
        <button
          type="button"
          onClick={(e) => { buttonRipple(e); setTimeout(() => navigate('/build'), 120) }}
          onTouchStart={buttonRipple}
          className="btn-press relative overflow-hidden rounded-full bg-[#FF4E6A] px-8 py-3.5 text-base font-medium text-[#E8F8F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4E6A]"
          style={{ animation: 'fadeUp 0.7s ease 0.3s both' }}
        >
          Build my meditation
        </button>
      </div>
    </main>
  )
}
