import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { WORKOUT_CYCLE, WORKOUT_COLORS } from '../lib/workoutDefinitions'
import { useAuth } from '../contexts/AuthContext'
import { SectionLabel, TypeBadge } from './ui'

export default function CycleView({ onSelectDay }) {
  const { user } = useAuth()
  const [lastWorkout, setLastWorkout] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLastWorkout() {
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      setLastWorkout(data)
      setLoading(false)
    }
    fetchLastWorkout()
  }, [user.id])

  const currentDay = lastWorkout ? (lastWorkout.day_number % 9) + 1 : 1

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: 10,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#555',
          marginBottom: 4,
        }}>
          {loading ? '...' : lastWorkout
            ? `Last session · Day ${lastWorkout.day_number} · ${lastWorkout.workout_type}`
            : 'Start your first workout'}
        </p>
        <h2 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 36,
          letterSpacing: '0.04em',
          color: '#f0f0f0',
          lineHeight: 1,
        }}>
          9-Day Cycle
        </h2>
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
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isDone ? '#333' : '#555',
                marginBottom: 2,
              }}>
                Day {workout.day}
              </p>
              <p style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 17,
                letterSpacing: '0.05em',
                color: typeColor,
                lineHeight: 1.1,
              }}>
                {isDone ? '✓' : workout.type.split(' ')[0]}
              </p>
              <p style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: 9,
                color: isDone ? '#2a2a2a' : '#444',
                marginTop: 2,
              }}>
                {workout.type.split(' ')[1] ?? (workout.rest ? 'Rest' : '')}
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
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
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
                    fontSize: 12,
                    color: isDone ? '#333' : color,
                    fontWeight: 500,
                  }}>
                    {isDone ? '✓' : workout.day}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    {/* Type + current badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <TypeBadge type={workout.type} />
                      {isCurrent && (
                        <span style={{
                          fontFamily: '"DM Mono", monospace',
                          fontSize: 9,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color,
                          background: `${color}20`,
                          padding: '2px 8px',
                          borderRadius: 3,
                        }}>
                          Up Next
                        </span>
                      )}
                    </div>
                    {/* Title */}
                    <p style={{
                      fontFamily: '"Bebas Neue", sans-serif',
                      fontSize: 20,
                      letterSpacing: '0.03em',
                      color: isDone ? '#3a3a3a' : '#f0f0f0',
                      lineHeight: 1,
                      marginBottom: 4,
                    }}>
                      {workout.rest
                        ? 'Rest Day'
                        : workout.notesOnly
                          ? workout.exercises[0]?.name
                          : `${workout.type} — ${workout.subtitle}`}
                    </p>
                    {/* Meta */}
                    <p style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: 10,
                      color: '#555',
                      letterSpacing: '0.04em',
                    }}>
                      Day {workout.day} · {workout.duration}
                    </p>
                  </div>
                </div>

                <span style={{ color: '#333', fontSize: 18, flexShrink: 0, paddingTop: 8 }}>›</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 40,
        paddingTop: 20,
        borderTop: '1px solid #1f1f1f',
        fontFamily: '"DM Mono", monospace',
        fontSize: 10,
        color: '#333',
        textAlign: 'center',
        letterSpacing: '0.08em',
      }}>
        PPL + VO2 Max · 9-Day Cycle · Add 2.5–5 lbs when you hit top of rep range
      </div>
    </div>
  )
}
