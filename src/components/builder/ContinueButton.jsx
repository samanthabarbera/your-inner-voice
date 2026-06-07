export default function ContinueButton({ onClick, disabled = false, label = 'Continue' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-sage-dark px-8 py-3.5 text-base font-medium text-white shadow-sm transition-colors duration-200 hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-sage-dark"
    >
      {label}
    </button>
  )
}
