import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { WORKOUT_COLORS } from '../lib/workoutDefinitions'
import { useAuth } from '../contexts/AuthContext'
import { SectionLabel, TypeBadge } from './ui'

function WorkoutDetail({ workout, onBack }) {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const color = WORKOUT_COLORS[workout.workout_type] ?? '#555'
  const isSkipped = workout.notes === 'SKIPPED'

  useEffect(() => {
    async function fetchSets() {
      const { data } = await supabase
        .from('sets')
        .select('*')
        .eq('workout_id', workout.id)
        .order('exercise_name')
        .order('set_number')

      setSets(data ?? [])
      setLoading(false)
    }
    fetchSets()
  }, [workout.id])

  function startEdit() {
    const vals = {}
    sets.forEach(s => {
      vals[s.id] = { weight_lbs: s.weight_lbs ?? '', reps: s.reps ?? '' }
    })
    setEditValues(vals)
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    await Promise.all(
      sets.map(s =>
        supabase.from('sets').update({
          weight_lbs: editValues[s.id].weight_lbs !== '' ? parseFloat(editValues[s.id].weight_lbs) : null,
          reps: editValues[s.id].reps !== '' ? parseInt(editValues[s.id].reps) : null,
        }).eq('id', s.id)
      )
    )
    // Refresh sets from db
    const { data } = await supabase
      .from('sets')
      .select('*')
      .eq('workout_id', workout.id)
      .order('exercise_name')
      .order('set_number')
    setSets(data ?? [])
    setSaving(false)
    setEditing(false)
  }

  async function handleDelete() {
    setSaving(true)
    await supabase.from('sets').delete().eq('workout_id', workout.id)
    await supabase.from('workouts').delete().eq('id', workout.id)
    setSaving(false)
    onBack()
  }

  const grouped = sets.reduce((acc, s) => {
    if (!acc[s.exercise_name]) acc[s.exercise_name] = []
    acc[s.exercise_name].push(s)
    return acc
  }, {})

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b6b6b',
            fontFamily: '"DM Mono", monospace',
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '0 0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← History
        </button>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20 }}>
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={saving}
                style={{ background: 'none', border: '1px solid #7f1d1d', borderRadius: 6, color: '#f87171', fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 10px', opacity: saving ? 0.5 : 1 }}
              >
                {saving ? '...' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ background: 'none', border: 'none', color: '#6b6b6b', fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 4px' }}
              >
                Cancel
              </button>
            </>
          ) : editing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, color: '#ff6b35', fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 12px', opacity: saving ? 0.5 : 1 }}
              >
                {saving ? '...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ background: 'none', border: 'none', color: '#6b6b6b', fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 4px' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {!loading && sets.length > 0 && (
                <button
                  onClick={startEdit}
                  style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, color: '#6b6b6b', fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 12px' }}
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, color: '#6b6b6b', fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '5px 12px' }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 6 }}>
        Day {workout.day_number}
      </p>
      <div style={{ marginBottom: 6 }}>
        <TypeBadge type={workout.workout_type} />
      </div>
      <h2 style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 32,
        letterSpacing: '0.04em',
        color,
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {workout.workout_type}
      </h2>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#6b6b6b', marginBottom: 24 }}>
        {new Date(workout.completed_at).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        })}
      </p>

      {isSkipped ? (
        <div style={{
          background: '#161616',
          border: '1px solid #2a2a2a',
          borderRadius: 10,
          padding: '24px 16px',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: '#444', letterSpacing: '0.06em', marginBottom: 4 }}>
            Skipped
          </p>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#444' }}>
            This day was skipped
          </p>
        </div>
      ) : loading ? (
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', textAlign: 'center', padding: '32px 0' }}>
          Loading...
        </p>
      ) : (
        <>
          <SectionLabel>Sets</SectionLabel>
          {Object.entries(grouped).map(([name, exerciseSets]) => (
            <div
              key={name}
              style={{
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                marginBottom: 10,
                overflow: 'hidden',
              }}
            >
              {/* Exercise header */}
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid #222',
                background: '#111',
              }}>
                <p style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#888',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {name}
                </p>
              </div>

              {/* Column headers */}
              <div style={{
                display: 'flex',
                padding: '6px 14px',
                gap: 8,
                borderBottom: '1px solid #1a1a1a',
              }}>
                <span style={{ width: 24, fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444' }}>SET</span>
                <span style={{ flex: 1, fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444' }}>WEIGHT</span>
                <span style={{ flex: 1, fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444' }}>REPS</span>
                <span style={{ width: 24, fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#444', textAlign: 'center' }}>✓</span>
              </div>

              {/* Set rows */}
              {exerciseSets.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderBottom: '1px solid #161616',
                    opacity: s.completed ? 1 : 0.6,
                  }}
                >
                  <span style={{ width: 24, fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#555' }}>{s.set_number}</span>

                  {editing ? (
                    <>
                      <input
                        type="number"
                        value={editValues[s.id]?.weight_lbs ?? ''}
                        onChange={e => setEditValues(prev => ({ ...prev, [s.id]: { ...prev[s.id], weight_lbs: e.target.value } }))}
                        placeholder="lbs"
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: 5,
                          background: '#0d0d0d',
                          border: '1px solid #333',
                          color: '#f0f0f0',
                          fontFamily: '"DM Mono", monospace',
                          fontSize: 13,
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="number"
                        value={editValues[s.id]?.reps ?? ''}
                        onChange={e => setEditValues(prev => ({ ...prev, [s.id]: { ...prev[s.id], reps: e.target.value } }))}
                        placeholder="reps"
                        style={{
                          flex: 1,
                          padding: '5px 8px',
                          borderRadius: 5,
                          background: '#0d0d0d',
                          border: '1px solid #333',
                          color: '#f0f0f0',
                          fontFamily: '"DM Mono", monospace',
                          fontSize: 13,
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontFamily: '"DM Mono", monospace', fontSize: 13, color: '#c0c0c0' }}>
                        {s.weight_lbs != null ? `${s.weight_lbs} lbs` : '—'}
                      </span>
                      <span style={{ flex: 1, fontFamily: '"DM Mono", monospace', fontSize: 13, color: '#c0c0c0' }}>
                        {s.reps != null ? `${s.reps} reps` : '—'}
                      </span>
                    </>
                  )}

                  <span style={{
                    width: 24,
                    fontFamily: '"DM Mono", monospace',
                    fontSize: 12,
                    color: s.completed ? '#22c55e' : '#333',
                    textAlign: 'center',
                  }}>
                    {s.completed ? '✓' : '○'}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {workout.notes && workout.notes !== 'SKIPPED' && (
            <>
              <SectionLabel>Notes</SectionLabel>
              <div style={{
                background: '#161616',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: 14,
              }}>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, color: '#bbb', lineHeight: 1.6 }}>
                  {workout.notes}
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function HistoryView() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function fetchWorkouts() {
      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })

      setWorkouts(data ?? [])
      setLoading(false)
    }
    fetchWorkouts()
  }, [user.id])

  if (selected) {
    return <WorkoutDetail workout={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <p style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: 10,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: '#6b6b6b',
        marginBottom: 4,
      }}>
        {loading ? '...' : `${workouts.length} session${workouts.length !== 1 ? 's' : ''} logged`}
      </p>
      <h2 style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 36,
        letterSpacing: '0.04em',
        color: '#f0f0f0',
        lineHeight: 1,
        marginBottom: 24,
      }}>
        History
      </h2>

      {loading ? (
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', textAlign: 'center', padding: '32px 0' }}>
          Loading...
        </p>
      ) : workouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#555', letterSpacing: '0.08em' }}>
            No workouts logged yet.
          </p>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#444', marginTop: 6 }}>
            Complete your first session to see it here.
          </p>
        </div>
      ) : (
        <>
          <SectionLabel>Sessions</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workouts.map(workout => {
              const color = WORKOUT_COLORS[workout.workout_type] ?? '#555'
              const date = new Date(workout.completed_at)
              const isSkipped = workout.notes === 'SKIPPED'
              return (
                <button
                  key={workout.id}
                  onClick={() => setSelected(workout)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: '#161616',
                    border: '1px solid #2a2a2a',
                    borderRadius: 10,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                    opacity: isSkipped ? 0.6 : 1,
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                  onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Day badge */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: `${color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: '"DM Mono", monospace',
                      fontSize: 13,
                      color,
                      fontWeight: 500,
                    }}>
                      {workout.day_number}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: 3 }}>
                        <TypeBadge type={workout.workout_type} />
                      </div>
                      <p style={{
                        fontFamily: '"Bebas Neue", sans-serif',
                        fontSize: 19,
                        letterSpacing: '0.03em',
                        color: '#f0f0f0',
                        lineHeight: 1,
                        marginBottom: 2,
                      }}>
                        {workout.workout_type}
                        {isSkipped && (
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#555', marginLeft: 8, letterSpacing: '0.08em' }}>
                            skipped
                          </span>
                        )}
                      </p>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#6b6b6b' }}>
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <span style={{ color: '#444', fontSize: 18 }}>›</span>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
