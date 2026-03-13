import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { WORKOUT_CYCLE, WORKOUT_COLORS } from '../lib/workoutDefinitions'
import { useAuth } from '../contexts/useAuth'
import { SectionLabel, TypeBadge } from './ui'

export default function CycleView({ onSelectDay }) {
  const { user } = useAuth()
  const [lastWorkout, setLastWorkout] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLastWorkout() {
      // Exclude REST_DAY records from the position query. REST_DAY means the user
      // took a rest instead of the scheduled workout — the workout is still pending.
      // SKIPPED records ARE included: a skip means the user explicitly moved past
      // that day, so the cycle should advance.
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .neq('notes', 'REST_DAY')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      setLastWorkout(data)
      setLoading(false)
    }
    fetchLastWorkout()
  }, [user.id])

  // Compute the next day to train: after Day 9, wrap back to Day 1.
  // `% 9` maps Day 9 → 0, then `+ 1` maps 0 → 1. Default to Day 1 with no history.
  const currentDay = lastWorkout ? (lastWorkout.day_number % 9) + 1 : 1

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-subtitle">
          {loading ? '...' : lastWorkout
            ? `Last session · Day ${lastWorkout.day_number} · ${lastWorkout.workout_type}`
            : 'Start your first workout'}
        </p>
        <h1 className="page-title">9-Day Cycle</h1>
      </div>

      {/* Horizontal pill grid */}
      <SectionLabel>9-Day Training Cycle</SectionLabel>
      <div className="cycle-grid" style={{ marginBottom: 28 }}>
        {WORKOUT_CYCLE.map((workout) => {
          const color = WORKOUT_COLORS[workout.type]
          const isCurrent = workout.day === currentDay
          const isDone = !loading && lastWorkout && workout.day < currentDay

          let bg, borderColor, typeColor
          if (isDone) {
            bg = '#141414'
            borderColor = '#1f1f1f'
            typeColor = '#3a3a3a'
          } else if (isCurrent) {
            bg = `${color}18`
            borderColor = `${color}60`
            typeColor = color
          } else {
            bg = '#141414'
            borderColor = '#1f1f1f'
            typeColor = color
          }

          return (
            <button
              key={workout.day}
              className="cycle-pill"
              onClick={() => onSelectDay(workout.day)}
              style={{ background: bg, borderColor }}
            >
              <p style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isDone ? '#333' : '#555',
                marginBottom: 2,
              }}>
                Day {workout.day}
              </p>
              <p style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 16,
                letterSpacing: '0.04em',
                color: typeColor,
                lineHeight: 1.2,
              }}>
                {isDone ? '✓' : workout.type}
              </p>
            </button>
          )
        })}
      </div>

      {/* Workout list */}
      <SectionLabel>Workouts</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {WORKOUT_CYCLE.map((workout) => {
          const color = WORKOUT_COLORS[workout.type]
          const isCurrent = workout.day === currentDay
          const isDone = !loading && lastWorkout && workout.day < currentDay

          return (
            <button
              key={workout.day}
              onClick={() => onSelectDay(workout.day)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: isCurrent ? `${color}0f` : '#111111',
                border: `1px solid ${isCurrent ? `${color}40` : '#1f1f1f'}`,
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'transform 0.15s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Day number badge */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: isDone ? '#1a1a1a' : `${color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 13,
                  color: isDone ? '#333' : color,
                  fontWeight: 500,
                }}>
                  {isDone ? '✓' : workout.day}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Type badge — same height as day number */}
                    <TypeBadge
                      type={workout.type}
                      style={{
                        height: 36,
                        minWidth: 76,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 10px',
                        fontSize: 14,
                        borderRadius: 6,
                        flexShrink: 0,
                        opacity: isDone ? 0.35 : 1,
                      }}
                    />
                    {/* Subtitle */}
                    {workout.subtitle && (
                      <p style={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: 19,
                        letterSpacing: '0.03em',
                        color: isDone ? '#3a3a3a' : '#f0f0f0',
                        lineHeight: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {workout.subtitle}
                      </p>
                    )}
                    {/* Up Next badge */}
                    {isCurrent && (
                      <span style={{
                        fontFamily: '"DM Mono", monospace',
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color,
                        background: `${color}20`,
                        padding: '2px 8px',
                        borderRadius: 3,
                        flexShrink: 0,
                      }}>
                        Up Next
                      </span>
                    )}
                  </div>
                  {/* Duration */}
                  <p style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    color: isDone ? '#333' : '#666',
                    marginTop: 5,
                  }}>
                    {workout.duration}
                  </p>
                </div>

                <span style={{ color: '#333', fontSize: 18, flexShrink: 0 }}>›</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="footer-note">
        PPL + VO2 Max · 9-Day Cycle · Add 2.5–5 lbs when you hit top of rep range
      </div>
    </div>
  )
}
