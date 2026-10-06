export default function StepContext({ value, onChange, accent = '#FFFFFF' }) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-medium uppercase leading-none tracking-tight text-ink sm:text-4xl">
        Tell us what&apos;s going on
      </h2>
      <p className="mt-3 font-light text-ink-muted">
        In a few words, what&apos;s happening in your life right now?
      </p>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. going through a breakup, stressed about money, feeling stuck"
        rows={5}
        className="mt-7 w-full resize-none rounded-3xl border-2 bg-canvas-deep px-5 py-4 text-base leading-relaxed text-ink placeholder:text-ink/35 transition-colors focus:outline-none"
        style={{ borderColor: value ? accent : 'rgba(255,255,255,0.12)' }}
        onFocus={e => { e.target.style.borderColor = accent }}
        onBlur={e => { e.target.style.borderColor = value ? accent : 'rgba(255,255,255,0.12)' }}
      />
    </div>
  )
}
