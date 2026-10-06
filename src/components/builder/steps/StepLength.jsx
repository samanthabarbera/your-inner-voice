import { LENGTHS } from '../../../data/builderOptions'
import CheckBadge from '../CheckBadge'

export default function StepLength({ selected, onSelect, accent = '#FFFFFF' }) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-medium uppercase leading-none tracking-tight text-ink sm:text-4xl">
        Choose your length
      </h2>
      <p className="mt-3 font-light text-ink-muted">Pick the time that fits your moment.</p>

      <ul className="mt-7 flex flex-col gap-2.5">
        {LENGTHS.map((length) => {
          const isSelected = selected === length.id
          return (
            <li key={length.id}>
              <button
                type="button"
                onClick={() => onSelect(length.id)}
                aria-pressed={isSelected}
                style={isSelected ? { background: accent } : undefined}
                className={`card-press${isSelected ? ' card-selected' : ''} flex w-full items-center justify-between rounded-3xl px-5 py-5 text-left ${
                  isSelected ? 'text-[#0B0B0C]' : 'bg-canvas-deep text-ink'
                }`}
              >
                <span className="flex items-baseline gap-2">
                  <span className="text-3xl font-medium leading-none">{length.minutes}</span>
                  <span className="text-base font-light">minutes</span>
                </span>
                {isSelected && <CheckBadge color={accent} />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
