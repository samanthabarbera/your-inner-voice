export default function StepContext({ value, onChange }) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
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
        className="mt-8 w-full resize-none rounded-2xl border border-sage-dark/15 bg-white/60 px-4 py-4 text-base leading-relaxed text-ink placeholder:text-ink-muted/50 transition-colors focus:border-sage-dark/40 focus:bg-white/90 focus:outline-none"
      />
    </div>
  )
}
