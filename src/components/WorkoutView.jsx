import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getWorkoutDay, WORKOUT_COLORS } from '../lib/workoutDefinitions'
import { useAuth } from '../contexts/AuthContext'

function SetRow({ set, lastSet, onChange, onToggle }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5"
      style={{ opacity: set.completed ? 0.5 : 1 }}
    >
      <span className="text-gray-600 text-sm w-6 text-center flex-shrink-0">
        {set.setNumber}
      </span>

      <div className="flex gap-2 flex-1">
        <div className="flex-1">
          <input
            type="number"
            placeholder={lastSet?.weight_lbs ?? 'lbs'}
            value={set.weight ?? ''}
            onChange={e => onChange(set.setNumber, 'weight', e.target.value)}
            disabled={set.completed}
            className="w-full px-3 py-2 rounded-lg text-center text-white text-sm focus:outline-none"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
          />
          {lastSet?.weight_lbs != null && (
            <p className="text-center text-xs mt-1" style={{ color: '#404040' }}>
              {lastSet.weight_lbs} lbs
            </p>
          )}
        </div>

        <div className="flex-1">
          <input
            type="number"
            placeholder={lastSet?.reps ?? 'reps'}
            value={set.reps ?? ''}
            onChange={e => onChange(set.setNumber, 'reps', e.target.value)}
            disabled={set.completed}
            className="w-full px-3 py-2 rounded-lg text-center text-white text-sm focus:outline-none"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
          />
          {lastSet?.reps != null && (
            <p className="text-center text-xs mt-1" style={{ color: '#404040' }}>
              {lastSet.reps} reps
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onToggle(set.setNumber)}
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
        style={{
          backgroundColor: set.completed ? '#22c55e22' : '#1a1a1a',
          border: `1px solid ${set.completed ? '#22c55e' : '#2a2a2a'}`,
          color: set.completed ? '#22c55e' : '#4b5563',
        }}
      >
        {set.completed ? '✓' : '○'}
      </button>
    </div>
  )
}

function ExerciseCard({ exercise, lastSets, sets, onSetChange, onSetToggle, color }) {
  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f' }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-white text-base">{exercise.name}</h3>
        <span className="text-xs" style={{ color }}>
          {exercise.sets}×{exercise.reps ?? '—'}
        </span>
      </div>

      <div className="flex gap-2 mb-2 px-6">
        <p className="flex-1 text-center text-xs text-gray-700">Weight</p>
        <p className="flex-1 text-center text-xs text-gray-700">Reps</p>
        <div className="w-8" />
      </div>

      {sets.map(set => (
        <SetRow
          key={set.setNumber}
          set={set}
          lastSet={lastSets?.[set.setNumber - 1]}
          onChange={onSetChange}
          onToggle={onSetToggle}
        />
      ))}
    </div>
  )
}

export default function WorkoutView({ dayNumber, onBack, onFinish }) {
  const { user } = useAuth()
  const workout = getWorkoutDay(dayNumber)
  const color = WORKOUT_COLORS[workout.type]

  const [sets, setSets] = useState({})
  const [lastSets, setLastSets] = useState({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [existingWorkoutId, setExistingWorkoutId] = useState(null)

  // Initialize sets from workout definition
  useEffect(() => {
    const initialSets = {}
    workout.exercises.forEach(ex => {
      initialSets[ex.name] = Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: '',
        reps: '',
        completed: false,
      }))
    })
    setSets(initialSets)
  }, [dayNumber])

  // Load last session's data for reference
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

  const handleSetChange = useCallback((exerciseName, setNumber, field, value) => {
    setSets(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map(s =>
        s.setNumber === setNumber ? { ...s, [field]: value } : s
      ),
    }))
  }, [])

  const handleSetToggle = useCallback((exerciseName, setNumber) => {
    setSets(prev => ({
      ...prev,
      [exerciseName]: prev[exerciseName].map(s =>
        s.setNumber === setNumber ? { ...s, completed: !s.completed } : s
      ),
    }))
  }, [])

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

    if (setRows.length > 0) {
      await supabase.from('sets').insert(setRows)
    }

    setSaving(false)
    onFinish?.()
  }

  if (workout.rest) {
    return (
      <div className="p-4 pb-24">
        <button onClick={onBack} className="text-gray-500 text-sm mb-6 flex items-center gap-1">
          ← Back
        </button>
        <div className="text-center pt-20">
          <div className="text-6xl mb-4">😴</div>
          <h2 className="text-2xl font-bold text-white mb-2">Rest Day</h2>
          <p className="text-gray-500">Day {dayNumber} — Recovery</p>
          <p className="text-gray-600 text-sm mt-4">Rest, hydrate, and let your body recover.</p>
        </div>
      </div>
    )
  }

  if (workout.notesOnly) {
    return (
      <div className="p-4 pb-24">
        <button onClick={onBack} className="text-gray-500 text-sm mb-6 flex items-center gap-1">
          ← Back
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
              Day {dayNumber}
            </span>
          </div>
          <h2 className="text-2xl font-bold" style={{ color }}>{workout.type}</h2>
          <p className="text-gray-500 text-sm mt-1">{workout.exercises[0]?.name}
            {workout.exercises[0]?.note && ` — ${workout.exercises[0].note}`}
          </p>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f' }}>
          <label className="text-gray-500 text-sm block mb-2">Session Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did it go? Distance, pace, heart rate..."
            rows={6}
            className="w-full bg-transparent text-white text-sm focus:outline-none resize-none placeholder-gray-700"
          />
        </div>

        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-black text-base transition-opacity disabled:opacity-50 active:scale-95"
          style={{ backgroundColor: color }}
        >
          {saving ? 'Saving...' : 'Finish Workout'}
        </button>
      </div>
    )
  }

  const totalSets = Object.values(sets).flat().length
  const completedSets = Object.values(sets).flat().filter(s => s.completed).length

  return (
    <div className="p-4 pb-24">
      <button onClick={onBack} className="text-gray-500 text-sm mb-6 flex items-center gap-1">
        ← Back
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
            Day {dayNumber}
          </span>
          {totalSets > 0 && (
            <span className="text-sm text-gray-600">
              {completedSets}/{totalSets} sets
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold" style={{ color }}>{workout.type}</h2>
      </div>

      {workout.exercises.map(exercise => (
        <ExerciseCard
          key={exercise.name}
          exercise={exercise}
          lastSets={lastSets[exercise.name]}
          sets={sets[exercise.name] ?? []}
          onSetChange={(setNumber, field, value) => handleSetChange(exercise.name, setNumber, field, value)}
          onSetToggle={(setNumber) => handleSetToggle(exercise.name, setNumber)}
          color={color}
        />
      ))}

      <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f' }}>
        <label className="text-gray-500 text-sm block mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How did this session feel?"
          rows={3}
          className="w-full bg-transparent text-white text-sm focus:outline-none resize-none placeholder-gray-700"
        />
      </div>

      <button
        onClick={handleFinish}
        disabled={saving}
        className="w-full py-4 rounded-2xl font-bold text-black text-base transition-opacity disabled:opacity-50 active:scale-95"
        style={{ backgroundColor: color }}
      >
        {saving ? 'Saving...' : 'Finish Workout'}
      </button>
    </div>
  )
}
