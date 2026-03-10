import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/useAuth'
import { useSettings } from '../contexts/useSettings'
import { SectionLabel } from './ui'
import { downloadCSV } from '../lib/export'

export default function AccountView() {
  const { user } = useAuth()
  const { weightUnit, setWeightUnit } = useSettings()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  async function exportAll() {
    setExporting(true)
    // Workouts
    const { data: allWorkouts } = await supabase
      .from('workouts')
      .select('id, day_number, workout_type, completed_at, notes')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
    const { data: allSets } = await supabase
      .from('sets')
      .select('workout_id, exercise_name, set_number, weight_lbs, reps, completed')
      .in('workout_id', (allWorkouts ?? []).map(w => w.id))
    const workoutMap = {}
    ;(allWorkouts ?? []).forEach(w => { workoutMap[w.id] = w })
    const wHeaders = ['Date', 'Day', 'Type', 'Notes', 'Exercise', 'Set', 'Weight (lbs)', 'Reps', 'Completed']
    const wRows = (allSets ?? []).map(s => {
      const w = workoutMap[s.workout_id] ?? {}
      return [
        w.completed_at ? new Date(w.completed_at).toLocaleDateString() : '',
        w.day_number ?? '', w.workout_type ?? '', w.notes ?? '',
        s.exercise_name, s.set_number, s.weight_lbs ?? '', s.reps ?? '',
        s.completed ? 'Yes' : 'No',
      ]
    })
    downloadCSV('workouts.csv', wHeaders, wRows)
    // Meals
    const { data: meals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('consumed_at', { ascending: false })
    const mHeaders = ['Date', 'Name', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fats (g)', 'Notes']
    const mRows = (meals ?? []).map(m => [
      new Date(m.consumed_at).toLocaleString(),
      m.name, m.calories ?? '', m.protein ?? '', m.carbs ?? '', m.fats ?? '', m.notes ?? '',
    ])
    downloadCSV('nutrition.csv', mHeaders, mRows)
    setExporting(false)
  }

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

      {/* Units */}
      <SectionLabel>Units</SectionLabel>
      <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px', marginBottom: 28, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b' }}>Weight</span>
        <button
          onClick={() => setWeightUnit('lbs')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: weightUnit === 'lbs' ? '1px solid #4ade80' : '1px solid #2a2a2a',
            background: weightUnit === 'lbs' ? '#092e0a' : 'transparent',
            color: '#f0f0f0',
            cursor: 'pointer',
          }}
        >
          lbs
        </button>
        <button
          onClick={() => setWeightUnit('kg')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: weightUnit === 'kg' ? '1px solid #4ade80' : '1px solid #2a2a2a',
            background: weightUnit === 'kg' ? '#092e0a' : 'transparent',
            color: '#f0f0f0',
            cursor: 'pointer',
          }}
        >
          kg
        </button>
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

      {/* Data export */}
      <SectionLabel>Data</SectionLabel>
      <button
        onClick={exportAll}
        disabled={exporting}
        className="btn btn-secondary"
        style={{ marginBottom: 10 }}
      >
        {exporting ? 'Exporting...' : 'Export All Data'}
      </button>

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
