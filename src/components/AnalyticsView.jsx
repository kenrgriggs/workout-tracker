import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/useAuth'
import { useSettings } from '../contexts/useSettings'
import { lbsToUnit, WEIGHT_UNITS } from '../lib/units'
import { SectionLabel } from './ui'
import { downloadCSV } from '../lib/export'

export default function AnalyticsView() {
  const { user } = useAuth()
  const { weightUnit } = useSettings()

  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalSets: 0,
    completedSets: 0,
    topExercises: [],
    recentRecords: [],
    thisWeekWorkouts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  async function exportWorkouts() {
    setExporting(true)
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
    const headers = ['Date', 'Day', 'Type', 'Notes', 'Exercise', 'Set', 'Weight (lbs)', 'Reps', 'Completed']
    const rows = (allSets ?? []).map(s => {
      const w = workoutMap[s.workout_id] ?? {}
      return [
        w.completed_at ? new Date(w.completed_at).toLocaleDateString() : '',
        w.day_number ?? '',
        w.workout_type ?? '',
        w.notes ?? '',
        s.exercise_name,
        s.set_number,
        s.weight_lbs ?? '',
        s.reps ?? '',
        s.completed ? 'Yes' : 'No',
      ]
    })
    downloadCSV('workouts.csv', headers, rows)
    setExporting(false)
  }

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)

      try {
        // Total workouts
        const { data: workouts, error: workoutError } = await supabase
          .from('workouts')
          .select('id, completed_at')
          .eq('user_id', user.id)
          .neq('notes', 'SKIPPED')

        if (workoutError) throw workoutError

        // Total & completed sets
        const { data: sets, error: setsError } = await supabase
          .from('sets')
          .select('exercise_name, weight_lbs, reps, completed')
          .in('workout_id', workouts?.map(w => w.id) || [])

        if (setsError) throw setsError

        // Count this week's workouts
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const thisWeekCount = workouts?.filter(w => new Date(w.completed_at) >= weekAgo).length || 0

        // Top exercises by volume
        const exerciseCount = {}
        const exerciseMaxes = {}
        sets?.forEach(s => {
          exerciseCount[s.exercise_name] = (exerciseCount[s.exercise_name] || 0) + 1

          const max = exerciseMaxes[s.exercise_name] || { weight_lbs: 0, reps: 0 }
          if (s.weight_lbs && s.weight_lbs > (max.weight_lbs || 0)) {
            max.weight_lbs = s.weight_lbs
            max.reps = s.reps || 0
          }
          exerciseMaxes[s.exercise_name] = max
        })

        const topEx = Object.entries(exerciseCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({
            name,
            count,
            max: exerciseMaxes[name],
          }))

        const completedCount = sets?.filter(s => s.completed).length || 0
        const totalCount = sets?.length || 0

        setStats({
          totalWorkouts: workouts?.length || 0,
          totalSets: totalCount,
          completedSets: completedCount,
          topExercises: topEx,
          thisWeekWorkouts: thisWeekCount,
        })
      } catch (err) {
        console.error('Analytics error:', err)
      }

      setLoading(false)
    }

    if (user?.id) fetchAnalytics()
  }, [user?.id])

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <p className="page-subtitle">Performance</p>
          <h1 className="page-title">Analytics</h1>
        </div>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', textAlign: 'center', padding: '28px 0' }}>
          Loading…
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-subtitle">Performance</p>
        <h1 className="page-title">Analytics</h1>
      </div>

      {/* Overview stats */}
      <SectionLabel>Overview</SectionLabel>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Workouts</div>
          <p className="stat-value">{stats.totalWorkouts}</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <p className="stat-value">{stats.thisWeekWorkouts}</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Sets</div>
          <p className="stat-value">{stats.totalSets}</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <p className="stat-value">
            {stats.totalSets > 0
              ? Math.round((stats.completedSets / stats.totalSets) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Top exercises */}
      {stats.topExercises.length > 0 && (
        <>
          <SectionLabel>Top Exercises</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {stats.topExercises.map((ex, i) => (
              <div key={i} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, margin: 0, lineHeight: 1.1 }}>
                      {ex.name}
                    </p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, color: '#6b6b6b', marginTop: 4 }}>
                      {ex.count} set{ex.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 14, margin: 0, color: '#4ade80' }}>
                      {ex.max?.weight_lbs ? lbsToUnit(ex.max.weight_lbs, weightUnit) : '—'} {weightUnit}
                    </p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>
                      × {ex.max?.reps || '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {stats.totalWorkouts === 0 && (
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', textAlign: 'center', padding: '40px 0' }}>
          Complete some workouts to see your analytics.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={exportWorkouts}
          disabled={exporting}
          style={{
            background: 'none',
            border: '1px solid #2a2a2a',
            borderRadius: 6,
            color: '#6b6b6b',
            fontFamily: '"DM Mono", monospace',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '5px 12px',
            opacity: exporting ? 0.5 : 1,
          }}
        >
          {exporting ? '...' : 'Export Workouts CSV'}
        </button>
      </div>
    </div>
  )
}
