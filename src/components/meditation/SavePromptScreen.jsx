import ContinueButton from '../builder/ContinueButton'

export default function SavePromptScreen({
  onSave,
  onStartOver,
  isSaved,
  isSaving = false,
  saveError = null,
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div>
          <h2 className="font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
            {isSaved ? 'Saved to your library' : 'Want to come back to this tomorrow?'}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            {isSaved
              ? 'Your meditation is ready whenever you need it.'
              : 'Save it to your library.'}
          </p>
        </div>

        {saveError && (
          <p className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
            {saveError}
          </p>
        )}

        {!isSaved && (
          <ContinueButton
            label={isSaving ? 'Saving...' : 'Save to library'}
            onClick={onSave}
            disabled={isSaving}
          />
        )}

        <button
          type="button"
          onClick={onStartOver}
          className="text-sm font-medium text-ink-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
        >
          Make a new one instead
        </button>
      </div>
    </main>
  )
}
