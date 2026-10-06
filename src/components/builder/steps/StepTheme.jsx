import { THEMES, UNIVERSE_THEME_ID } from '../../../data/builderOptions'
import { themeColor } from '../../../data/themeColors'
import Starburst from '../../Starburst'
import CheckBadge from '../CheckBadge'

export default function StepTheme({ selected, onSelect }) {
  const regularThemes = THEMES.filter((t) => t.id !== UNIVERSE_THEME_ID)
  const universeTheme = THEMES.find((t) => t.id === UNIVERSE_THEME_ID)
  const universeSelected = universeTheme && selected === universeTheme.id

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-medium uppercase leading-none tracking-tight text-ink sm:text-4xl">
        Choose a theme
      </h2>
      <p className="mt-3 font-light text-ink-muted">What area of life is calling for attention?</p>

      <ul className="mt-7 grid grid-cols-2 gap-2.5">
        {regularThemes.map((theme) => {
          const isSelected = selected === theme.id
          const color = themeColor(theme.id)
          return (
            <li key={theme.id}>
              <button
                type="button"
                onClick={() => onSelect(theme.id)}
                aria-pressed={isSelected}
                style={{ background: color }}
                className={`card-press${isSelected ? ' card-selected' : ''} flex min-h-28 w-full flex-col justify-between rounded-3xl p-4 text-left text-[17px] leading-tight text-[#0B0B0C] ${
                  isSelected ? 'font-semibold' : 'font-medium'
                }`}
              >
                <span className="self-end">{isSelected && <CheckBadge color={color} />}</span>
                <span>{theme.label}</span>
              </button>
            </li>
          )
        })}

        {universeTheme && (
          <li className="col-span-2">
            <button
              type="button"
              onClick={() => onSelect(universeTheme.id)}
              aria-pressed={universeSelected}
              className={`card-press${universeSelected ? ' card-selected' : ''} flex w-full items-center gap-4 rounded-3xl border px-5 py-4 text-left ${
                universeSelected
                  ? 'border-transparent bg-[#F26BB5] text-[#0B0B0C]'
                  : 'border-white/20 bg-canvas-deep text-ink'
              }`}
            >
              <Starburst size={38} showLines={false} color={universeSelected ? '#0B0B0C' : '#F26BB5'} />
              <span className="flex-1">
                <span className="block text-base font-medium">{universeTheme.label}</span>
                <span className={`mt-0.5 block text-sm font-light ${universeSelected ? 'text-[#0B0B0C]/80' : 'text-ink-muted'}`}>
                  {universeTheme.description}
                </span>
              </span>
              {universeSelected && <CheckBadge color="#F26BB5" />}
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}
