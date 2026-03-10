import { useMemo, useState } from 'react'
import { WORKOUT_CYCLE, WORKOUT_COLORS } from '../lib/workoutDefinitions'
import { SectionLabel, TypeBadge } from './ui'

const PROGRAM_PRINCIPLES = [
  {
    label: 'Why 9 days',
    value:
      'Decouples training from the calendar. No more “leg day is always Saturday.” Each cycle repeats on its own schedule.',
  },
  {
    label: 'Push and Pull twice',
    value:
      'Chest hits Push A + Push B. Biceps hit Pull A + Pull B. 2× frequency per muscle group is the sweet spot for hypertrophy.',
  },
  {
    label: 'Cardio placement',
    value:
      'Zone 2 on Day 2 aids recovery after Push A. VO2 on Day 4 sits between Pull A and Rest — hard effort, then a full recovery day after.',
  },
  {
    label: 'Cardio after lifting',
    value:
      '20 min Zone 2 treadmill ends each lifting session. Low enough intensity it won’t blunt hypertrophy signaling.',
  },
]

export default function ProgramView() {
  const [openId, setOpenId] = useState(null)

  const openWorkout = (day) => {
    setOpenId((prev) => (prev === day ? null : day))
  }

  const daysGrid = useMemo(() => WORKOUT_CYCLE, [])

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-subtitle">Training Program / PPL + VO2 Max</p>
        <h1 className="page-title">
          <span style={{ color: WORKOUT_COLORS['Push A'] }}>PUSH</span>
          <span style={{ color: WORKOUT_COLORS['Pull A'] }}> PULL </span>
          <span style={{ color: WORKOUT_COLORS['Legs'] }}>LEGS</span>
          <span style={{ display: 'block', fontSize: 18, marginTop: 6, color: WORKOUT_COLORS['VO2'] }}>
            + VO2 Max Protocol
          </span>
        </h1>
        <div className="stats-grid" style={{ marginTop: 22 }}>
          <div className="stat-card">
            <div className="stat-label">Cycle</div>
            <p className="stat-value">9 days</p>
          </div>
          <div className="stat-card">
            <div className="stat-label">Lift sessions</div>
            <p className="stat-value">~55 min</p>
          </div>
          <div className="stat-card">
            <div className="stat-label">VO2 intervals</div>
            <p className="stat-value">Once / cycle</p>
          </div>
          <div className="stat-card">
            <div className="stat-label">Zone 2</div>
            <p className="stat-value">Once / cycle</p>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rest days</div>
            <p className="stat-value">2 per cycle</p>
          </div>
        </div>
      </div>

      <SectionLabel>9-Day Training Cycle</SectionLabel>
      <div className="cycle-grid" style={{ marginBottom: 40 }}>
        {daysGrid.map((workout) => {
          const color = WORKOUT_COLORS[workout.type] ?? '#555'
          const typeClass = workout.type.toLowerCase().replace(/\s+/g, '-')
          return (
            <button
              key={workout.day}
              className={`day-pill ${typeClass}`}
              onClick={() => openWorkout(workout.day)}
              style={{
                cursor: 'pointer',
              }}
            >
              <div className="day-name">Day {workout.day}</div>
              <div className="day-type" style={{ color }}>{workout.type}</div>
              <div className="day-sub">{workout.subtitle}</div>
            </button>
          )
        })}
      </div>

      <SectionLabel>Program Logic</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 40 }}>
        {PROGRAM_PRINCIPLES.map(p => (
          <div key={p.label} className="card">
            <div className="small-label">{p.label}</div>
            <div style={{ fontSize: 13, color: '#f0f0f0' }}>
              {p.value}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Workouts</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 100 }}>
        {daysGrid.map((workout) => {
          const color = WORKOUT_COLORS[workout.type] ?? '#555'
          const isOpen = openId === workout.day
          return (
            <div key={workout.day} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 10, overflow: 'hidden' }}>
              <button
                onClick={() => openWorkout(workout.day)}
                style={{
                  width: '100%',
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="type-badge" style={{ backgroundColor: `${color}25`, color, padding: '3px 10px', borderRadius: 4, fontFamily: '"Bebas Neue", sans-serif', fontSize: 13 }}>
                    {workout.type}
                  </span>
                  <div>
                    <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, letterSpacing: '0.04em', color: '#f0f0f0' }}>
                      {workout.type} — {workout.subtitle}
                    </div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#6b6b6b', marginTop: 4 }}>
                      Day {workout.day} · {workout.duration}
                    </div>
                  </div>
                </div>

                <span style={{ color: '#6b6b6b', fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  ▾
                </span>
              </button>

              <div style={{
                maxHeight: isOpen ? 9999 : 0,
                overflow: 'hidden',
                transition: 'max-height 220ms ease',
                borderTop: '1px solid #1f1f1f',
              }}>
                <div style={{ padding: '16px 16px 20px' }}>
                  {workout.timing?.length ? (
                    <div className="timing-bar">
                      {workout.timing.map((t, i) => (
                        <span key={t.label}>
                          {t.label}:{' '}
                          <span style={{ color: '#e0e0e0', fontWeight: 500 }}>{t.value}</span>
                          {i < workout.timing.length - 1 && <span className="timing-sep">|</span>}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {workout.description ? (
                    <div style={{ marginTop: 14, background: '#161616', border: '1px solid #222', borderRadius: 10, padding: 14 }}>
                      <p style={{ margin: 0, fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#ccc' }}>
                        {workout.description}
                      </p>
                    </div>
                  ) : null}

                  {workout.exercises?.length ? (
                    <table className="ex-table" style={{ marginTop: 16 }}>
                      <thead>
                        <tr>
                          <th style={{ width: '38%' }}>Exercise</th>
                          <th>Sets × Reps</th>
                          <th>Muscles</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workout.exercises.map((ex) => (
                          <tr key={ex.name}>
                            <td><div className="ex-name">{ex.name}</div></td>
                            <td><div className="ex-sets">{ex.sets}{ex.reps ? ` × ${ex.reps}` : ''}</div></td>
                            <td>
                              {ex.muscles?.map(m => (
                                <span key={m} className="muscle-tag">{m}</span>
                              ))}
                            </td>
                            <td><div className="ex-note">{ex.note}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
