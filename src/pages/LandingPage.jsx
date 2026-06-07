import Logo from '../components/Logo'

export default function LandingPage({ onStart }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex w-full max-w-md flex-col items-center gap-10">
        <Logo />

        <p className="max-w-sm text-lg leading-relaxed text-ink-muted sm:text-xl">
          A meditation made for your exact moment
        </p>

        <button
          type="button"
          onClick={onStart}
          className="rounded-full bg-sage-dark px-8 py-3.5 text-base font-medium text-white shadow-sm transition-colors duration-200 hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark"
        >
          Build my meditation
        </button>
      </div>
    </main>
  )
}
