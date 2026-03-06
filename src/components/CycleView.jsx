import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { WORKOUT_CYCLE, WORKOUT_COLORS } from '../lib/workoutDefinitions'
import { useAuth } from '../contexts/AuthContext'

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

  const currentDay = lastWorkout
    ? (lastWorkout.day_number % 9) + 1
    : 1

  function getDayStatus(day) {
    if (!lastWorkout) return day === 1 ? 'current' : 'upcoming'
    const last = lastWorkout.day_number
    if (day === currentDay) return 'current'
    if (day <= last % 9 || (last === 9 && day <= 9)) return 'done'
    return 'upcoming'
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">9-Day Cycle</h2>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? 'Loading...' : lastWorkout
            ? `Last: Day ${lastWorkout.day_number} · ${lastWorkout.workout_type}`
            : 'Start your first workout'}
        </p>
      </div>

      <div className="space-y-3">
        {WORKOUT_CYCLE.map((workout) => {
          const color = WORKOUT_COLORS[workout.type]
          const isCurrent = workout.day === currentDay
          const isDone = !loading && lastWorkout && workout.day < currentDay

          return (
            <button
              key={workout.day}
              onClick={() => onSelectDay(workout.day)}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-95"
              style={{
                backgroundColor: isCurrent ? `${color}18` : '#141414',
                border: isCurrent ? `1px solid ${color}60` : '1px solid #1f1f1f',
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: isDone ? '#1f1f1f' : `${color}22`,
                    color: isDone ? '#4b5563' : color,
                  }}
                >
                  {isDone ? '✓' : workout.day}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold text-base"
                      style={{ color: isDone ? '#6b7280' : isCurrent ? color : '#e5e7eb' }}
                    >
                      {workout.type}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}30`, color }}
                      >
                        Up Next
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs mt-0.5 truncate">
                    {workout.rest
                      ? 'Recovery day'
                      : workout.notesOnly
                        ? workout.exercises[0]?.name
                        : `${workout.exercises.length} exercises`}
                  </p>
                </div>

                <div className="text-gray-700 text-sm flex-shrink-0">
                  Day {workout.day}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
