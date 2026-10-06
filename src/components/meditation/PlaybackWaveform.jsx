export default function PlaybackWaveform({ levels, isActive, color = '#FFFFFF' }) {
  return (
    <div
      className="flex h-20 items-center justify-center gap-1 px-2"
      aria-hidden="true"
    >
      {levels.map((level, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full transition-[height] duration-75"
          style={{
            background: color,
            height: `${Math.max(6, (isActive ? level : 0.12) * 76)}px`,
            opacity: isActive ? 0.45 + level * 0.55 : 0.25,
          }}
        />
      ))}
    </div>
  )
}
