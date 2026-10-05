export default function Logo() {
  return (
    <div className="flex flex-col items-center gap-5" aria-label="Tune-Up">
      {/* P palette accent dots */}
      <div className="flex items-center gap-2" aria-hidden="true">
        <span className="inline-block h-3 w-3 rounded-full bg-[#FF4E6A]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[#00C2C8]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[rgba(232,248,248,0.7)]" />
      </div>
      <h1 className="font-display text-5xl font-normal tracking-tight text-ink sm:text-6xl">
        Tune-Up
      </h1>
    </div>
  )
}
