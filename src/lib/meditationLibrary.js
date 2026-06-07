const LIBRARY_STORAGE_KEY = 'tune-up-meditation-library'

export function saveMeditationToLibrary(meditation) {
  const existing = JSON.parse(
    localStorage.getItem(LIBRARY_STORAGE_KEY) || '[]',
  )

  const entry = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...meditation,
  }

  existing.unshift(entry)
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(existing))

  return entry
}
