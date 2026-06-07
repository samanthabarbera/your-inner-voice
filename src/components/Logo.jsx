export default function Logo() {
  return (
    <div className="flex flex-col items-center gap-4" aria-label="Tune-Up">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="text-sage-dark"
      >
        <circle
          cx="28"
          cy="28"
          r="26"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.25"
        />
        <circle
          cx="28"
          cy="28"
          r="18"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <path
          d="M18 32c3.5-6 7-9 10-9s6.5 3 10 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="28" cy="22" r="2.5" fill="currentColor" fillOpacity="0.6" />
      </svg>
      <h1 className="font-display text-5xl font-medium tracking-tight text-ink sm:text-6xl">
        Tune-Up
      </h1>
    </div>
  )
}
