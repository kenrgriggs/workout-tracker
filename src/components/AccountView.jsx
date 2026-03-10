import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SectionLabel } from './ui'

export default function AccountView() {
  const { user } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    setStatus(null)
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) {
      setStatus({ type: 'error', message: error.message })
    } else {
      setStatus({ type: 'success', message: 'Password updated.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-subtitle">Settings</p>
        <h1 className="page-title">Account</h1>
      </div>

      {/* Account info */}
      <SectionLabel>Account Info</SectionLabel>
      <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px', marginBottom: 28 }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 4 }}>
          Email
        </p>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, color: '#f5f5f5' }}>
          {user?.email}
        </p>
      </div>

      {/* Change password */}
      <SectionLabel>Change Password</SectionLabel>
      <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        <input
          className="input"
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />

        {status && (
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: 11,
            color: status.type === 'success' ? '#4ade80' : '#f87171',
            letterSpacing: '0.04em',
          }}>
            {status.message}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      {/* Danger zone */}
      <SectionLabel>Session</SectionLabel>
      <button
        className="btn btn-secondary"
        onClick={() => supabase.auth.signOut()}
      >
        Sign Out
      </button>
    </div>
  )
}
