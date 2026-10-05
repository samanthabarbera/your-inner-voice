import { useRipple } from '../../hooks/useRipple'

export default function ContinueButton({ onClick, disabled, children = 'Continue' }) {
  const ripple = useRipple('rgba(232,248,248,0.4)')

  const handleClick = (e) => {
    if (!disabled) {
      ripple(e)
      onClick?.(e)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={disabled ? undefined : ripple}
      disabled={disabled}
      className="btn-press relative overflow-hidden w-full rounded-full bg-[#FF4E6A] px-8 py-3.5 text-base font-medium text-[#E8F8F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4E6A] disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  )
}
