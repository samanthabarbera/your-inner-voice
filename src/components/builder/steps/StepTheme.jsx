import { THEMES, UNIVERSE_THEME_ID } from '../../../data/builderOptions'

const POP_COLORS = ['#FF4E6A', '#00C2C8', '#FF4E6A', '#00C2C8', '#FF4E6A', '#00C2C8', '#FF4E6A', '#00C2C8']

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
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
      <h2 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
        Choose a theme
      </h2>
      <p className="mt-2 text-ink-muted">What area of life is calling for attention?</p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {regularThemes.map((theme, i) => {
          const isSelected = selected === theme.id
          const popColor = POP_COLORS[i % POP_COLORS.length]
          const shadowColor = isSelected
            ? (popColor === '#FF4E6A' ? '#a8273d' : '#007a80')
            : 'rgba(0,0,0,0.35)'
          return (
            <li key={theme.id}>
              <button
                type="button"
                onClick={() => onSelect(theme.id)}
                style={isSelected
                  ? { background: popColor, borderColor: popColor, '--shadow-color': shadowColor }
                  : { borderLeftColor: popColor, borderLeftWidth: '4px' }
                }
                className={`card-press${isSelected ? ' card-selected' : ''} w-full rounded-2xl border-2 px-4 py-4 text-left text-base font-medium ${
                  isSelected
                    ? 'text-white'
                    : 'border-white/10 bg-white/8 text-ink'
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
              style={selected === universeTheme.id
                ? { background: '#FF4E6A', borderColor: '#FF4E6A' }
                : { borderLeftColor: '#FF4E6A', borderLeftWidth: '4px' }
              }
              className={`card-press${selected === universeTheme.id ? ' card-selected' : ''} w-full rounded-2xl border-2 px-5 py-5 text-left ${
                selected === universeTheme.id
                  ? ''
                  : 'border-white/10 bg-white/8'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={selected === universeTheme.id ? 'text-white' : 'text-ink-muted'}>
                  <SparkleIcon />
                </span>
                <span className={`text-base font-medium ${selected === universeTheme.id ? 'text-white' : 'text-ink'}`}>
                  {universeTheme.label}
                </span>
              </span>
              <p className={`mt-1 ml-7 text-sm ${selected === universeTheme.id ? 'text-white/70' : 'text-ink-muted'}`}>
                {universeTheme.description}
              </p>
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
