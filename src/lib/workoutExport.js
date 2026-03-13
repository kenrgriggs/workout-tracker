import { downloadCSV } from './export'

// Fetches all workouts and their sets for a given user, then triggers a
// 'workouts.csv' download. This function is extracted from the three components
// that duplicated the same two-query fetch + join + CSV logic verbatim:
// HistoryView, AnalyticsView, and AccountView (the workouts half of exportAll).
//
// Supabase doesn't support a single-query JOIN across tables, so the export
// requires two sequential fetches: workouts first to get the IDs, then sets
// filtered to those IDs. The join is done in-memory via a workoutMap.
//
// `supabase` is passed as a parameter rather than imported directly so
// the function stays mockable in tests without requiring a module-level mock
// of the singleton client.
export async function exportWorkoutsCSV(supabase, userId) {
  const { data: allWorkouts } = await supabase
    .from('workouts')
    .select('id, day_number, workout_type, completed_at, notes')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  const { data: allSets } = await supabase
    .from('sets')
    .select('workout_id, exercise_name, set_number, weight_lbs, reps, completed')
    .in('workout_id', (allWorkouts ?? []).map(w => w.id))

  // Build a map keyed by workout ID so set rows can look up their parent
  // workout's metadata (date, type, notes) in O(1) rather than O(n) per set.
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
}
