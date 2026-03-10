import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getWorkoutDay, WORKOUT_COLORS } from '../lib/workoutDefinitions'
import { useAuth } from '../contexts/useAuth'
import { useSettings } from '../contexts/useSettings'
import { lbsToUnit, unitToLbs, WEIGHT_UNITS } from '../lib/units'
import { SectionLabel, TypeBadge, TimingBar, MuscleTags } from './ui'

function SetRow({ set, lastSet, onChange, onToggle, onRemove, canRemove, weightUnit }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 0',
      opacity: set.completed ? 0.45 : 1,
      borderBottom: '1px solid #161616',
    }}>
      {canRemove && (
        <button
          onClick={() => onRemove(set.setNumber)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'transparent',
            border: '1px solid #7f1d1d',
            color: '#f87171',
            fontFamily: '"DM Mono", monospace',
            fontSize: 14,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          title="Remove set"
        >
          −
        </button>
      )}

      {/* Set number */}
      <span style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: 13,
        color: '#555',
        width: 20,
        textAlign: 'center',
        flexShrink: 0,
      }}>
        {set.setNumber}
      </span>

      {/* Weight */}
      <div style={{ flex: 1 }}>
        <input
          type="number"
          placeholder={lastSet?.weight_lbs != null ? String(lbsToUnit(lastSet.weight_lbs, weightUnit)) : (weightUnit === WEIGHT_UNITS.KG ? 'kg' : 'lbs')}
          value={set.weight !== '' ? String(lbsToUnit(set.weight, weightUnit)) : ''}
          onChange={e => onChange(set.setNumber, 'weight', e.target.value)}
          disabled={set.completed}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            background: '#161616',
            border: '1px solid #252525',
            color: '#f0f0f0',
            fontFamily: '"DM Mono", monospace',
            fontSize: 14,
            textAlign: 'center',
            outline: 'none',
          }}
        />
        {lastSet?.weight_lbs != null && (
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: 11,
            color: '#555',
            textAlign: 'center',
            marginTop: 3,
          }}>
            prev: {lbsToUnit(lastSet.weight_lbs, weightUnit)}
          </p>
        )}
      </div>

      {/* Reps */}
      <div style={{ flex: 1 }}>
        <input
          type="number"
          placeholder={lastSet?.reps != null ? String(lastSet.reps) : 'reps'}
          value={set.reps ?? ''}
          onChange={e => onChange(set.setNumber, 'reps', e.target.value)}
          disabled={set.completed}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            background: '#161616',
            border: '1px solid #252525',
            color: '#f0f0f0',
            fontFamily: '"DM Mono", monospace',
            fontSize: 14,
            textAlign: 'center',
            outline: 'none',
          }}
        />
        {lastSet?.reps != null && (
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: 11,
            color: '#555',
            textAlign: 'center',
            marginTop: 3,
          }}>
            prev: {lastSet.reps}
          </p>
        )}
      </div>

      {/* Complete toggle */}
      <button
        onClick={() => onToggle(set.setNumber)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: set.completed ? '#22c55e18' : '#161616',
          border: `1px solid ${set.completed ? '#22c55e' : '#2a2a2a'}`,
          color: set.completed ? '#22c55e' : '#444',
          fontFamily: '"DM Mono", monospace',
          fontSize: 14,
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
        }}
      >
        {set.completed ? '✓' : '○'}
      </button>

    </div>
  )
}

function ExerciseCard({ exercise, lastSets, sets, onSetChange, onSetToggle, onAddSet, onRemoveSet, weightUnit, color }) {
  const completedCount = sets.filter(s => s.completed).length

  const lastSet = lastSets && lastSets.length ? lastSets[lastSets.length - 1] : null
  const lastWeightDisplay = lastSet?.weight_lbs != null ? lbsToUnit(lastSet.weight_lbs, weightUnit) : '--'
  const lastRepsDisplay = lastSet?.reps != null ? lastSet.reps : '--'

  return (
    <div style={{
      background: '#0d0d0d',
      border: '1px solid #1a1a1a',
      borderRadius: 12,
      marginBottom: 10,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    }}>
      {/* Card header */}
      <div style={{ padding: '14px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: 17,
            color: '#f0f0f0',
            lineHeight: 1.3,
            flex: 1,
          }}>
            {exercise.name}
          </p>
          <span style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: 15,
            color,
            flexShrink: 0,
            fontWeight: 500,
          }}>
            {exercise.sets}×{exercise.reps ?? '—'}
          </span>
        </div>
        <p style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: 13,
          color: '#888',
        }}>
          Last known: {lastWeightDisplay} {weightUnit} × {lastRepsDisplay} reps
        </p>

        {/* Muscles */}
        {exercise.muscles && <div style={{ marginBottom: 4 }}><MuscleTags muscles={exercise.muscles} /></div>}

        {/* Coaching note */}
        {exercise.note && (
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: 12,
            color: '#666',
            lineHeight: 1.5,
          }}>
            {exercise.note}
          </p>
        )}

        {/* Progress indicator */}
        {sets.length > 0 && completedCount > 0 && (
          <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
            {sets.map((s, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 2,
                  background: s.completed ? color : '#2a2a2a',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Column headers */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderTop: '1px solid #191919',
        background: '#0d0d0d',
      }}>
        {sets.length > 1 && <span style={{ width: 32, flexShrink: 0 }} />}
        <span style={{ width: 20 }} />
        <span style={{
          flex: 1,
          fontFamily: '"DM Mono", monospace',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#555',
          textAlign: 'center'
        }}>{weightUnit.toUpperCase()}</span>
        <span style={{
          flex: 1,
          fontFamily: '"DM Mono", monospace',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#555',
          textAlign: 'center'
        }}>REPS</span>
        <span style={{ width: 32 }} />
      </div>

      {/* Set rows */}
      <div style={{ padding: '0 14px' }}>
        {sets.map(set => (
          <SetRow
            key={set.setNumber}
            set={set}
            lastSet={lastSets?.[set.setNumber - 1]}
            onChange={onSetChange}
            onToggle={onSetToggle}
            onRemove={onRemoveSet}
            canRemove={sets.length > 1}
            weightUnit={weightUnit}
          />
        ))}

        <button
          onClick={() => onAddSet(exercise.name)}
          style={{
            width: 32,
            height: 32,
            margin: '12px auto',
            borderRadius: 6,
            border: '1px solid #0f5132',
            background: '#02280f',
            color: '#4ade80',
            fontFamily: '"DM Mono", monospace',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function WorkoutView({ dayNumber, onBack, onFinish }) {
  const { user } = useAuth()
  const { weightUnit } = useSettings()
  const workout = getWorkoutDay(dayNumber)
  const color = WORKOUT_COLORS[workout.type]

  const draftKey = `wt_draft_${user?.id}_${dayNumber}`

  const [sets, setSets] = useState(() => {
    const initial = {}
    workout.exercises.forEach(ex => {
      initial[ex.name] = Array.from({ length: ex.sets ?? 0 }, (_, i) => ({
        setNumber: i + 1,
        weight: '',
        reps: '',
        completed: false,
      }))
    })

    if (typeof window === 'undefined' || !user?.id) return initial

    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return initial
      const parsed = JSON.parse(raw)
      if (!parsed?.sets) return initial
      return parsed.sets
    } catch {
      return initial
    }
  })
  const [lastSets, setLastSets] = useState({})
  const [notes, setNotes] = useState(() => {
    if (typeof window === 'undefined' || !user?.id) return ''
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return ''
      const parsed = JSON.parse(raw)
      return parsed?.notes ?? ''
    } catch {
      return ''
    }
  })
  const [saving, setSaving] = useState(false)



  useEffect(() => {
    async function fetchLastSession() {
      const { data: lastWorkout } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('day_number', dayNumber)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastWorkout) return

      const { data: lastSetData } = await supabase
        .from('sets')
        .select('*')
        .eq('workout_id', lastWorkout.id)
        .order('set_number', { ascending: true })

      if (lastSetData) {
        const grouped = {}
        lastSetData.forEach(s => {
          if (!grouped[s.exercise_name]) grouped[s.exercise_name] = []
          grouped[s.exercise_name].push(s)
        })
        setLastSets(grouped)
      }
    }
    fetchLastSession()
  }, [dayNumber, user.id])

  useEffect(() => {
    if (!user?.id) return
    localStorage.setItem(draftKey, JSON.stringify({ sets, notes }))
  }, [draftKey, notes, sets, user?.id])

  const handleSetChange = useCallback((exerciseName, setNumber, field, value) => {
    const parsedValue = field === 'weight'
      ? unitToLbs(value, weightUnit)
      : value

    setSets(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map(s =>
        s.setNumber === setNumber ? { ...s, [field]: parsedValue } : s
      ),
    }))
  }, [weightUnit])

  const handleSetToggle = useCallback((exerciseName, setNumber) => {
    setSets(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map(s =>
        s.setNumber === setNumber ? { ...s, completed: !s.completed } : s
      ),
    }))
  }, [])

  const handleAddSet = useCallback((exerciseName) => {
    setSets(prev => {
      const existing = prev[exerciseName] ?? []
      const nextNumber = existing.length + 1
      return {
        ...prev,
        [exerciseName]: [
          ...existing,
          { setNumber: nextNumber, weight: '', reps: '', completed: false },
        ],
      }
    })
  }, [])

  const handleRemoveSet = useCallback((exerciseName, setNumber) => {
    setSets(prev => {
      const existing = prev[exerciseName] ?? []
      const filtered = existing.filter(s => s.setNumber !== setNumber)
      const renumbered = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }))
      return {
        ...prev,
        [exerciseName]: renumbered,
      }
    })
  }, [])

  async function handleSkip() {
    setSaving(true)
    await supabase.from('workouts').insert({
      user_id: user.id,
      day_number: dayNumber,
      workout_type: workout.type,
      completed_at: new Date().toISOString(),
      notes: 'SKIPPED',
    })
    localStorage.removeItem(draftKey)
    setSaving(false)
    onFinish?.()
  }

  async function handleFinish() {
    setSaving(true)

    const { data: workoutRow, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        day_number: dayNumber,
        workout_type: workout.type,
        completed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .select()
      .single()

    if (workoutError) {
      console.error(workoutError)
      setSaving(false)
      return
    }

    const setRows = []
    Object.entries(sets).forEach(([exerciseName, exerciseSets]) => {
      exerciseSets.forEach(s => {
        setRows.push({
          workout_id: workoutRow.id,
          user_id: user.id,
          exercise_name: exerciseName,
          set_number: s.setNumber,
          weight_lbs: s.weight ? parseFloat(s.weight) : null,
          reps: s.reps ? parseInt(s.reps) : null,
          completed: s.completed,
        })
      })
    })

    if (setRows.length > 0) await supabase.from('sets').insert(setRows)

    localStorage.removeItem(draftKey)
    setSaving(false)
    onFinish?.()
  }

  const backBtn = (label = 'Back') => (
    <button
      onClick={onBack}
      style={{
        background: 'none',
        border: 'none',
        color: '#555',
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
      ← {label}
    </button>
  )

  if (workout.rest) {
    return (
      <div className="page">
        {backBtn()}
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontSize: 56, marginBottom: 16 }}>😴</p>
          <p style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#6b6b6b',
            marginBottom: 8,
          }}>
            Day {dayNumber}
          </p>
          <h2 style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 48,
            color: '#444',
            letterSpacing: '0.04em',
            marginBottom: 12,
          }}>
            Rest Day
          </h2>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#444', marginBottom: 40 }}>
            Recovery · Hydrate · Let the body adapt
          </p>
        </div>
        <button
          onClick={handleSkip}
          disabled={saving}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid #2a2a2a',
            color: '#6b6b6b',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 20,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Logging...' : 'Log Rest Day'}
        </button>
      </div>
    )
  }

  if (workout.notesOnly) {
    const ex = workout.exercises[0]
    return (
      <div className="page">
        {backBtn()}
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
          Day {dayNumber}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <TypeBadge type={workout.type} />
        </div>
        <h2 style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 36,
          letterSpacing: '0.04em',
          color,
          lineHeight: 1,
          marginBottom: 4,
        }}>
          {ex?.name ?? workout.type}
        </h2>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#6b6b6b', marginBottom: workout.description ? 12 : 20 }}>
          {ex?.note}
        </p>

        {workout.description && (
          <div style={{
            padding: '10px 14px',
            background: '#161616',
            border: '1px solid #222',
            borderRadius: 6,
            marginBottom: 20,
            fontFamily: '"DM Mono", monospace',
            fontSize: 11,
            color: '#6b6b6b',
            lineHeight: 1.6,
          }}>
            {workout.description}
          </div>
        )}

        <SectionLabel>Session Notes</SectionLabel>
        <div style={{
          background: '#0d0d0d',
          border: '1px solid #1a1a1a',
          borderRadius: 12,
          padding: '14px',
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Distance, pace, heart rate, how it felt..."
            rows={7}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f0f0f0',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              resize: 'none',
              lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleFinish}
            disabled={saving}
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 8,
              background: color,
              border: 'none',
              color: '#000',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 22,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Finish Workout'}
          </button>
          <button
            onClick={handleSkip}
            disabled={saving}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid #2a2a2a',
              color: '#6b6b6b',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 20,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            Skip Day
          </button>
        </div>
      </div>
    )
  }

  const allSets = Object.values(sets).flat()
  const totalSets = allSets.length
  const completedSets = allSets.filter(s => s.completed).length

  return (
    <div className="page">
      {backBtn()}

      {/* Header */}
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>
        Day {dayNumber}
        {totalSets > 0 && (
          <span style={{ marginLeft: 12 }}>
            {completedSets}/{totalSets} sets
          </span>
        )}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <TypeBadge type={workout.type} />
      </div>
      <h2 style={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: 36,
        letterSpacing: '0.04em',
        color,
        lineHeight: 1,
        marginBottom: 2,
      }}>
        {workout.type} — {workout.subtitle}
      </h2>
      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#666', marginBottom: 16, letterSpacing: '0.04em' }}>
        {workout.duration}
      </p>

      {/* Timing bar */}
      <TimingBar timing={workout.timing} />

      {/* Workout description */}
      {workout.description && (
        <div style={{
          padding: '10px 14px',
          background: '#161616',
          border: '1px solid #222',
          borderRadius: 6,
          marginBottom: 20,
          fontFamily: '"DM Mono", monospace',
          fontSize: 12,
          color: '#777',
          lineHeight: 1.6,
        }}>
          {workout.description}
        </div>
      )}

      {/* Exercises */}
      <SectionLabel>Exercises</SectionLabel>
      {workout.exercises.map(exercise => (
        <ExerciseCard
          key={exercise.name}
          exercise={exercise}
          lastSets={lastSets[exercise.name]}
          sets={sets[exercise.name] ?? []}
          onSetChange={(setNumber, field, value) => handleSetChange(exercise.name, setNumber, field, value)}
          onSetToggle={(setNumber) => handleSetToggle(exercise.name, setNumber)}
          onAddSet={handleAddSet}
          onRemoveSet={(setNumber) => handleRemoveSet(exercise.name, setNumber)}
          weightUnit={weightUnit}
          color={color}
        />
      ))}

      {/* Notes */}
      <SectionLabel style={{ marginTop: 8 }}>Notes</SectionLabel>
      <div style={{
        background: '#0d0d0d',
        border: '1px solid #1a1a1a',
        borderRadius: 12,
        padding: '14px',
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How did this session feel?"
          rows={3}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f0f0f0',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 14,
            resize: 'none',
            lineHeight: 1.6,
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleFinish}
          disabled={saving}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 8,
            background: color,
            border: 'none',
            color: '#000',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 22,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            opacity: saving ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {saving ? 'Saving...' : 'Finish Workout'}
        </button>
        <button
          onClick={handleSkip}
          disabled={saving}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid #2a2a2a',
            color: '#6b6b6b',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 20,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            opacity: saving ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          Skip Day
        </button>
      </div>
    </div>
  )
}
