import { TOTAL_STEPS } from '../../data/builderOptions'
import ProgressIndicator from './ProgressIndicator'

export default function BuilderLayout({ currentStep, children, footer }) {
  return (
    <div className="flex min-h-svh flex-col px-6 py-8">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <header className="mb-10">
          <p className="mb-4 text-center text-sm font-medium tracking-wide text-ink-muted">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
          <ProgressIndicator currentStep={currentStep} />
        </header>

        <div className="flex flex-1 flex-col">{children}</div>

        {footer && <footer className="mt-10 pt-4">{footer}</footer>}
      </div>
    </div>
  )
}
