import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }

    setLoading(false)
  }

  return (
    <div style={{ position: 'relative', backgroundColor: '#0a0a0a', minHeight: '100dvh' }}>
      <div className="noise-overlay" />
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ width: '100%', maxWidth: 340 }}>
          {/* Eyebrow */}
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#555',
            marginBottom: 12,
          }}>
            Training / Authentication
          </p>

          {/* Display title */}
          <h1 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(52px, 14vw, 80px)',
            lineHeight: 0.9,
            letterSpacing: '0.02em',
            marginBottom: 24,
          }}>
            <span style={{ color: '#ff6b35' }}>PUSH</span>{' '}
            <span style={{ color: '#4af0ff' }}>PULL</span>{' '}
            <span style={{ color: '#e8ff4a' }}>LEGS</span>
            <span style={{
              display: 'block',
              fontSize: '0.42em',
              color: '#555',
              marginTop: 6,
              letterSpacing: '0.04em',
            }}>
              + VO2 Max Protocol
            </span>
          </h1>

          {/* Meta row */}
          <div style={{
            display: 'flex',
            gap: 20,
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: '1px solid #1f1f1f',
          }}>
            {[
              { label: 'Cycle', value: '9 days' },
              { label: 'Lift sessions', value: '~55 min' },
              { label: 'Rest days', value: '2 / cycle' },
            ].map(m => (
              <div key={m.label}>
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 2 }}>
                  {m.label}
                </p>
                <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, color: '#e0e0e0', fontWeight: 500 }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            {error && (
              <p style={{ color: '#ff6b6b', fontFamily: '"DM Mono", monospace', fontSize: 12, textAlign: 'center' }}>
                {error}
              </p>
            )}
            {message && (
              <p style={{ color: '#4ade80', fontFamily: '"DM Mono", monospace', fontSize: 12, textAlign: 'center' }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontFamily: '"DM Mono", monospace',
            fontSize: 11,
            color: '#555',
            marginTop: 20,
          }}>
            {mode === 'login' ? "No account? " : 'Have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
              className="subtle-btn"
              style={{ textDecoration: 'underline' }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

