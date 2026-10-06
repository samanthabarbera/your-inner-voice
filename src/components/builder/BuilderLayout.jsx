import { useEffect, useRef, useState } from 'react'
import { TOTAL_STEPS } from '../../data/builderOptions'
import ProgressIndicator from './ProgressIndicator'

export default function BuilderLayout({ currentStep, totalSteps = TOTAL_STEPS, accent = '#FFFFFF', children, footer }) {
  const [sliding, setSliding] = useState(false)
  const [direction, setDirection] = useState('forward')
  const prevStep = useRef(currentStep)

  useEffect(() => {
    if (currentStep !== prevStep.current) {
      setDirection(currentStep > prevStep.current ? 'forward' : 'back')
      setSliding(true)
      const t = setTimeout(() => {
        setSliding(false)
        prevStep.current = currentStep
      }, 220)
      return () => clearTimeout(t)
    }
  }, [currentStep])

  const slideOut = sliding ? (direction === 'forward' ? 'translateX(-18px)' : 'translateX(18px)') : 'translateX(0)'

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden px-5 py-8">
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex-1">
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} color={accent} />
          </div>
          <p className="text-sm font-medium tabular-nums text-ink-muted">
            {currentStep}/{totalSteps}
          </p>
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
