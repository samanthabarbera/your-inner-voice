import { useEffect, useRef, useState, useCallback } from 'react'
import { TOTAL_STEPS } from '../../data/builderOptions'
import ProgressIndicator from './ProgressIndicator'

export default function BuilderLayout({ currentStep, totalSteps = TOTAL_STEPS, children, footer }) {
  const [displayStep, setDisplayStep] = useState(currentStep)
  const [sliding, setSliding] = useState(false)
  const [direction, setDirection] = useState('forward')
  const prevStep = useRef(currentStep)
  const mainRef = useRef(null)

  useEffect(() => {
    if (currentStep !== prevStep.current) {
      setDirection(currentStep > prevStep.current ? 'forward' : 'back')
      setSliding(true)
      const t = setTimeout(() => {
        setDisplayStep(currentStep)
        setSliding(false)
        prevStep.current = currentStep
      }, 220)
      return () => clearTimeout(t)
    }
  }, [currentStep])

  const handleTap = useCallback((e) => {
    const el = mainRef.current
    if (!el) return
    // don't ripple if tapping a button/input
    if (e.target.closest('button, input, textarea, select')) return
    const rect = el.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: absolute;
      left: ${x}px; top: ${y}px;
      width: 8px; height: 8px;
      margin-left: -4px; margin-top: -4px;
      border-radius: 50%;
      background: rgba(232,248,248,0.18);
      pointer-events: none;
      animation: rippleOut 1s ease-out forwards;
      z-index: 5;
    `
    el.appendChild(ripple)
    setTimeout(() => ripple.remove(), 1000)
  }, [])

  const blobSets = [
    ['rgba(255,78,106,0.2)', 'rgba(0,194,200,0.18)'],
    ['rgba(0,194,200,0.22)', 'rgba(255,78,106,0.16)'],
    ['rgba(255,78,106,0.18)', 'rgba(0,194,200,0.2)'],
    ['rgba(0,194,200,0.18)', 'rgba(255,78,106,0.16)'],
  ]
  const [c1, c2] = blobSets[(currentStep - 1) % blobSets.length]

  const slideOut = sliding ? (direction === 'forward' ? 'translateX(-18px)' : 'translateX(18px)') : 'translateX(0)'

  return (
    <div
      ref={mainRef}
      onClick={handleTap}
      onTouchStart={handleTap}
      className="relative flex min-h-svh flex-col overflow-hidden px-6 py-8"
    >
      <style>{`
        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(30px, 40px) scale(1.06); }
          70% { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(-35px, -35px) scale(1.04); }
          70% { transform: translate(25px, 25px) scale(0.96); }
        }
        @keyframes rippleOut {
          0%   { transform: scale(1);  opacity: 0.7; }
          100% { transform: scale(60); opacity: 0; }
        }
      `}</style>

      {/* Animated blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{
          position: 'absolute', width: '65%', height: '55%',
          top: '-5%', left: '-5%', borderRadius: '50%',
          background: `radial-gradient(ellipse, ${c1} 0%, transparent 70%)`,
          animation: 'blobFloat1 16s ease-in-out infinite',
          transition: 'background 0.7s ease',
        }} />
        <div style={{
          position: 'absolute', width: '60%', height: '50%',
          bottom: '-5%', right: '-5%', borderRadius: '50%',
          background: `radial-gradient(ellipse, ${c2} 0%, transparent 70%)`,
          animation: 'blobFloat2 20s ease-in-out infinite',
          transition: 'background 0.7s ease',
        }} />
      </div>

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <header className="mb-10">
          <p className="mb-4 text-center text-sm font-medium tracking-wide text-ink-muted">
            Step {currentStep} of {totalSteps}
          </p>
          <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </header>

        <div
          className="flex flex-1 flex-col"
          style={{
            transform: slideOut,
            opacity: sliding ? 0 : 1,
            transition: sliding ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.28s ease',
          }}
        >
          {children}
        </div>

        {footer && <footer className="mt-10 pt-4">{footer}</footer>}
      </div>
    </div>
  )
}
