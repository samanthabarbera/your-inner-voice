export default function RecordingWaveform({ levels, isActive }) {
  return (
    <div
      className="flex h-20 items-center justify-center gap-1 px-4"
      aria-hidden="true"
    >
      {levels.map((level, index) => (
        <span
          key={index}
          className="w-1.5 rounded-full bg-sage-dark/70 transition-[height] duration-75"
          style={{
            height: `${(isActive ? level : 0.15) * 64}px`,
            opacity: isActive ? 0.45 + level * 0.55 : 0.25,
          }}
        />
      ))}
    </div>
  )
}
