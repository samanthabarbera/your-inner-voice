import { LENGTHS } from '../../../data/builderOptions'

export default function StepLength({ selected, onSelect }) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        Choose your meditation length
      </h2>
      <p className="mt-2 text-ink-muted">Pick the time that fits your moment.</p>

      <ul className="mt-8 flex flex-col gap-3">
        {LENGTHS.map((length) => {
          const isSelected = selected === length.id

          return (
            <li key={length.id}>
              <button
                type="button"
                onClick={() => onSelect(length.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-5 py-5 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-sage-dark bg-white/90 text-ink shadow-sm'
                    : 'border-sage-dark/15 bg-white/50 text-ink-muted hover:border-sage-dark/30 hover:bg-white/70'
                }`}
              >
                <span className="text-lg font-medium">{length.label}</span>
                {isSelected && (
                  <span className="text-sm text-sage" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
