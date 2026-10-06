export default function ContinueButton({ onClick, disabled, label, children }) {
  const text = children ?? label ?? 'Continue'
  return (
    <button
      type="button"
      onClick={(e) => { if (!disabled) onClick?.(e) }}
      disabled={disabled}
      className="btn-press flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {text}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  )
}
