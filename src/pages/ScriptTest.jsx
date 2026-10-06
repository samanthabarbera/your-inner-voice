import { useState } from 'react'
import { THEMES, LENGTHS } from '../data/builderOptions'

const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')).replace(/\/api$/, '')

export default function ScriptTest() {
  const [theme, setTheme] = useState(THEMES[0].id)
  const [situation, setSituation] = useState('')
  const [length, setLength] = useState('10')
  const [script, setScript] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(null)

  async function generate() {
    setLoading(true)
    setError(null)
    setScript(null)
    const start = Date.now()

    try {
      const res = await fetch(`${API_BASE}/api/generate-meditation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, situation, length }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setScript(data.script)
      setElapsed(((Date.now() - start) / 1000).toFixed(1))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Script Test</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 200px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Theme</span>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              style={{ padding: '8px 10px', fontSize: 14, border: '1px solid #ccc', borderRadius: 6 }}
            >
              {THEMES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 120px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Length</span>
            <select
              value={length}
              onChange={e => setLength(e.target.value)}
              style={{ padding: '8px 10px', fontSize: 14, border: '1px solid #ccc', borderRadius: 6 }}
            >
              {LENGTHS.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Situation <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </span>
          <textarea
            value={situation}
            onChange={e => setSituation(e.target.value)}
            placeholder="What's happening in their life right now..."
            rows={3}
            style={{ padding: '8px 10px', fontSize: 14, border: '1px solid #ccc', borderRadius: 6, resize: 'vertical', fontFamily: 'monospace' }}
          />
        </label>

        <button
          onClick={generate}
          disabled={loading}
          style={{
            alignSelf: 'flex-start',
            padding: '10px 24px',
            fontSize: 14,
            fontWeight: 600,
            background: loading ? '#888' : '#2d4a3e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating…' : 'Generate Script'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {script && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#666' }}>
              {script.split(/\s+/).filter(Boolean).length} words · {elapsed}s
            </span>
            <button
              onClick={() => navigator.clipboard?.writeText(script)}
              style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
            >
              Copy
            </button>
          </div>
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: '#f8f8f8',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '20px 24px',
            fontSize: 13,
            lineHeight: 1.8,
            margin: 0,
          }}>
            {script}
          </pre>
        </div>
      )}
    </div>
  )
}
