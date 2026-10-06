// Asks Supabase which sign-in providers are switched on, so the Google button
// only shows once Google sign-in is configured in the Supabase dashboard.
let cached = null

export function getEnabledProviders() {
  if (cached) return cached
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  cached = fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
    .then((r) => (r.ok ? r.json() : null))
    .then((s) => s?.external ?? {})
    .catch(() => ({}))
  return cached
}
