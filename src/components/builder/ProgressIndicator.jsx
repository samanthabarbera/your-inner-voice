import { TOTAL_STEPS } from '../../data/builderOptions'

export default function ProgressIndicator({ currentStep }) {
  return (
    <div
      className="flex w-full gap-1.5"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={TOTAL_STEPS}
      aria-label={`Step ${currentStep} of ${TOTAL_STEPS}`}
    >
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <div
            key={stepNumber}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              isComplete || isCurrent ? 'bg-sage-dark' : 'bg-sage-dark/15'
            } ${isCurrent ? 'opacity-100' : isComplete ? 'opacity-70' : 'opacity-100'}`}
          />
        )
      })}
    </div>
  )
}
