import { TOTAL_STEPS } from '../../data/builderOptions'

export default function ProgressIndicator({ currentStep, totalSteps = TOTAL_STEPS, color = '#FFFFFF' }) {
  const pct = Math.max(0, Math.min(1, currentStep / totalSteps)) * 100

  return (
    <div
      className="relative h-1.5 w-full overflow-hidden rounded-full bg-canvas-raised"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
