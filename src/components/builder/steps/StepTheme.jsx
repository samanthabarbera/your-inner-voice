import { THEMES } from '../../../data/builderOptions'

export default function StepTheme({ selected, onSelect }) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        Choose a theme
      </h2>
      <p className="mt-2 text-ink-muted">What area of life is calling for attention?</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {THEMES.map((theme) => {
          const isSelected = selected === theme.id

          return (
            <li key={theme.id}>
              <button
                type="button"
                onClick={() => onSelect(theme.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left text-base font-medium transition-all duration-200 ${
                  isSelected
                    ? 'border-sage-dark bg-white/90 text-ink shadow-sm'
                    : 'border-sage-dark/15 bg-white/50 text-ink-muted hover:border-sage-dark/30 hover:bg-white/70'
                }`}
              >
                {theme.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
