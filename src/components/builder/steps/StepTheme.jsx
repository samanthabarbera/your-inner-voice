import { THEMES, UNIVERSE_THEME_ID } from '../../../data/builderOptions'

function SparkleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 1.5l1.5 4.5 4.5 1.5-4.5 1.5L12 13.5l-1.5-4.5L6 7.5l4.5-1.5z" />
      <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z" />
      <path d="M5 14l.75 2.25L8 17l-2.25.75L5 20l-.75-2.25L2 17l2.25-.75z" />
    </svg>
  )
}

export default function StepTheme({ selected, onSelect }) {
  const regularThemes = THEMES.filter((t) => t.id !== UNIVERSE_THEME_ID)
  const universeTheme = THEMES.find((t) => t.id === UNIVERSE_THEME_ID)

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
        Choose a theme
      </h2>
      <p className="mt-2 text-ink-muted">What area of life is calling for attention?</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {regularThemes.map((theme) => {
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

        {universeTheme && (
          <li className="sm:col-span-2">
            <button
              type="button"
              onClick={() => onSelect(universeTheme.id)}
              className={`w-full rounded-2xl border px-5 py-5 text-left transition-all duration-200 ${
                selected === universeTheme.id
                  ? 'border-sage-dark bg-white/90 shadow-sm'
                  : 'border-sage-dark/20 bg-white/50 hover:border-sage-dark/35 hover:bg-white/70'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`transition-colors duration-200 ${
                    selected === universeTheme.id ? 'text-sage-dark' : 'text-ink-muted'
                  }`}
                >
                  <SparkleIcon />
                </span>
                <span
                  className={`text-base font-medium transition-colors duration-200 ${
                    selected === universeTheme.id ? 'text-ink' : 'text-ink-muted'
                  }`}
                >
                  {universeTheme.label}
                </span>
              </span>
              <p
                className={`mt-1 ml-7 text-sm transition-colors duration-200 ${
                  selected === universeTheme.id ? 'text-ink-muted' : 'text-ink-muted/70'
                }`}
              >
                {universeTheme.description}
              </p>
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
