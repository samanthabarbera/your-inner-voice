import { TOTAL_STEPS } from '../../data/builderOptions'

export default function ProgressIndicator({ currentStep, totalSteps = TOTAL_STEPS }) {
  const popColors = ['#FF4E6A', '#00C2C8', '#FF4E6A', '#00C2C8']

  return (
    <div
      className="flex w-full gap-1.5"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep
        const color = popColors[(index) % popColors.length]

        return (
          <div
            key={stepNumber}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: isComplete || isCurrent ? color : 'rgba(232,248,248,0.3)',
              opacity: isComplete || isCurrent ? 1 : 0.12,
            }}
          />
        )
      })}
    </div>
  )
}
