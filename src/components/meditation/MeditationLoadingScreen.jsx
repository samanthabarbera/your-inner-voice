export default function MeditationLoadingScreen({ title, message }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex max-w-sm flex-col items-center gap-8">
        <div className="relative flex h-24 w-24 items-center justify-center" aria-hidden="true">
          <span className="absolute inline-flex h-20 w-20 animate-pulse-soft rounded-full bg-sage-dark/10" />
          <span className="absolute inline-flex h-14 w-14 animate-pulse-soft rounded-full bg-sage-dark/20 [animation-delay:0.4s]" />
          <span className="relative inline-flex h-8 w-8 rounded-full bg-sage-dark/40 animate-pulse-soft [animation-delay:0.8s]" />
        </div>

        <div>
          {title && (
            <p className="mb-2 text-sm font-medium tracking-wide text-ink-muted">
              {title}
            </p>
          )}
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
            Generating your meditation...
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            {message}
          </p>
        </div>
      </div>
    </main>
  )
}
