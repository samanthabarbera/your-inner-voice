import { LENGTHS } from '../../../data/builderOptions'

const POP_COLORS = ['#FF4E6A', '#00C2C8', '#FF4E6A']

export default function StepLength({ selected, onSelect }) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
        Choose your length
      </h2>
      <p className="mt-2 text-ink-muted">Pick the time that fits your moment.</p>

      <ul className="mt-8 flex flex-col gap-3">
        {LENGTHS.map((length, i) => {
          const isSelected = selected === length.id
          const popColor = POP_COLORS[i % POP_COLORS.length]
          return (
            <li key={length.id}>
              <button
                type="button"
                onClick={() => onSelect(length.id)}
                style={isSelected
                  ? { background: popColor, borderColor: popColor }
                  : { borderLeftColor: popColor, borderLeftWidth: '4px' }
                }
                className={`card-press${isSelected ? ' card-selected' : ''} flex w-full items-center justify-between rounded-2xl border-2 px-5 py-5 text-left ${
                  isSelected
                    ? 'text-white'
                    : 'border-white/10 bg-white/8 text-ink'
                }`}
              >
                <span className="text-lg font-medium">{length.label}</span>
                {isSelected && (
                  <span className="text-sm text-white/70" aria-hidden="true">✓</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
