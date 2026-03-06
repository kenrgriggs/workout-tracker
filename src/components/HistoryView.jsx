import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { WORKOUT_COLORS } from '../lib/workoutDefinitions'
import { useAuth } from '../contexts/AuthContext'

function WorkoutDetail({ workout, onBack }) {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const color = WORKOUT_COLORS[workout.workout_type] ?? '#6b7280'

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

  const grouped = sets.reduce((acc, s) => {
    if (!acc[s.exercise_name]) acc[s.exercise_name] = []
    acc[s.exercise_name].push(s)
    return acc
  }, {})

  return (
    <div className="p-4 pb-24">
      <button onClick={onBack} className="text-gray-500 text-sm mb-6 flex items-center gap-1">
        ← History
      </button>

      <div className="mb-6">
        <p className="text-gray-500 text-sm">Day {workout.day_number}</p>
        <h2 className="text-2xl font-bold" style={{ color }}>{workout.workout_type}</h2>
        <p className="text-gray-600 text-sm mt-1">
          {new Date(workout.completed_at).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })}
        </p>
      </div>

      {loading ? (
        <p className="text-gray-600 text-center py-8">Loading...</p>
      ) : (
        <>
          {Object.entries(grouped).map(([name, exerciseSets]) => (
            <div
              key={name}
              className="rounded-2xl p-4 mb-3"
              style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f' }}
            >
              <h3 className="font-semibold text-white mb-3">{name}</h3>
              {exerciseSets.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-gray-600 text-sm w-6 text-center">{s.set_number}</span>
                  <span className="flex-1 text-sm text-gray-300">
                    {s.weight_lbs != null ? `${s.weight_lbs} lbs` : '—'}
                  </span>
                  <span className="flex-1 text-sm text-gray-300">
                    {s.reps != null ? `${s.reps} reps` : '—'}
                  </span>
                  <span style={{ color: s.completed ? '#22c55e' : '#4b5563' }} className="text-sm">
                    {s.completed ? '✓' : '○'}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {workout.notes && (
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f' }}
            >
              <p className="text-gray-500 text-xs mb-1">Notes</p>
              <p className="text-gray-300 text-sm">{workout.notes}</p>
            </div>
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
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold text-white mb-6">History</h2>

      {loading ? (
        <p className="text-gray-600 text-center py-8">Loading...</p>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600">No workouts logged yet.</p>
          <p className="text-gray-700 text-sm mt-1">Complete your first session to see it here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.map(workout => {
            const color = WORKOUT_COLORS[workout.workout_type] ?? '#6b7280'
            const date = new Date(workout.completed_at)
            return (
              <button
                key={workout.id}
                onClick={() => setSelected(workout)}
                className="w-full text-left rounded-2xl p-4 transition-all active:scale-95"
                style={{ backgroundColor: '#111111', border: '1px solid #1f1f1f' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    {workout.day_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{workout.workout_type}</p>
                    <p className="text-gray-600 text-sm">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-gray-700 text-sm">›</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
