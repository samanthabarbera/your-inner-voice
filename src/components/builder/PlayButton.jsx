export default function PlayButton({ onClick, isLoading = false, disabled = false, isSelected = false }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      disabled={disabled || isLoading}
      aria-label={isLoading ? 'Loading preview' : 'Preview voice'}
      aria-busy={isLoading}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70 ${
        isSelected
          ? 'border-white/30 bg-white/20 text-white hover:bg-white/30 focus-visible:outline-white'
          : 'border-white/15 bg-white/8 text-ink hover:border-white/30 focus-visible:outline-white'
      }`}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M2.5 1.5v9l7.5-4.5L2.5 1.5z" />
        </svg>
      )}
    </button>
  )
}
