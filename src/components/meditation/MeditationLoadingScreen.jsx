import { themeColor } from '../../data/themeColors'
import Starburst from '../Starburst'

export default function MeditationLoadingScreen({ title, message, theme }) {
  const color = theme ? themeColor(theme) : '#F26BB5'
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex max-w-sm flex-col items-center gap-8">
        <div className="animate-starburst" aria-hidden="true" style={{ animationDuration: '8s' }}>
          <Starburst size={140} color={color} />
        </div>

        <div>
          {title && (
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.12em] text-ink-muted">
              {title}
            </p>
          )}
          <h2 className="font-display text-3xl font-medium uppercase leading-none tracking-tight text-ink">
            Generating your meditation
          </h2>
          <p className="mt-4 text-base font-light leading-relaxed text-ink-muted">
            {message}
          </p>
        </div>
      </div>
    </main>
  )
}
