export default function PlaybackWaveform({ levels, isActive }) {
  return (
    <div
      className="flex h-28 items-end justify-center gap-1 px-2"
      aria-hidden="true"
    >
      {levels.map((level, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-ink/60 transition-[height] duration-75"
          style={{
            height: `${(isActive ? level : 0.15) * 96}px`,
            opacity: isActive ? 0.4 + level * 0.6 : 0.2,
          }}
        />
      ))}
    </div>
  )
}
