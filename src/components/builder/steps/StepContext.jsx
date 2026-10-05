export default function StepContext({ value, onChange }) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
        Tell us what&apos;s going on
      </h2>
      <p className="mt-2 text-ink-muted">
        In a few words, what&apos;s happening in your life right now?
      </p>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. going through a breakup, stressed about money, feeling stuck"
        rows={5}
        className="mt-8 w-full resize-none rounded-2xl border-2 px-4 py-4 text-base leading-relaxed text-ink placeholder:text-ink/30 transition-colors focus:outline-none"
        style={{
          background: 'rgba(255,255,255,0.08)',
          borderColor: value ? '#FF4E6A' : 'rgba(232,248,248,0.15)',
        }}
        onFocus={e => e.target.style.borderColor = '#FF4E6A'}
        onBlur={e => e.target.style.borderColor = value ? '#FF4E6A' : 'rgba(232,248,248,0.15)'}
      />
    </div>
  )
}
