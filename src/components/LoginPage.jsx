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
    <div className="noise-overlay" style={{ position: 'relative' }}>
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#0a0a0a',
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
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                background: '#141414',
                border: '1px solid #2a2a2a',
                color: '#f0f0f0',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                background: '#141414',
                border: '1px solid #2a2a2a',
                color: '#f0f0f0',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 14,
                outline: 'none',
              }}
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
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 8,
                background: '#ff6b35',
                border: 'none',
                color: '#000',
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 20,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
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
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontFamily: '"DM Mono", monospace', fontSize: 11, textDecoration: 'underline' }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
