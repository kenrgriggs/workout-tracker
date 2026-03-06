export const WORKOUT_COLORS = {
  'Push A': '#ff6b35',
  'Push B': '#ff6b35',
  'Pull A': '#4af0ff',
  'Pull B': '#4af0ff',
  'Legs': '#e8ff4a',
  'VO2': '#ff3b3b',
  'Zone 2': '#a78bfa',
  'Rest': '#6b7280',
}

export const WORKOUT_CYCLE = [
  {
    day: 1,
    type: 'Push A',
    exercises: [
      { name: 'Incline Bench Press', sets: 4, reps: 10 },
      { name: 'Flat Bench Press', sets: 3, reps: 10 },
      { name: 'Machine Flyes', sets: 3, reps: 12 },
      { name: 'Overhead Press', sets: 4, reps: 10 },
      { name: 'Side Lateral Raises', sets: 3, reps: 15 },
      { name: 'Ab Work', sets: 3, reps: 15 },
    ],
  },
  {
    day: 2,
    type: 'Zone 2',
    notesOnly: true,
    exercises: [
      { name: 'Easy Run', sets: 1, reps: null, note: '45-60 min' },
    ],
  },
  {
    day: 3,
    type: 'Pull A',
    exercises: [
      { name: 'Barbell Row', sets: 4, reps: 10 },
      { name: 'Lat Pulldown', sets: 4, reps: 10 },
      { name: 'Seated Cable Row', sets: 3, reps: 12 },
      { name: 'Face Pulls', sets: 3, reps: 15 },
      { name: 'Barbell Curl', sets: 3, reps: 10 },
      { name: 'Hammer Curls', sets: 3, reps: 10 },
    ],
  },
  {
    day: 4,
    type: 'VO2',
    notesOnly: true,
    exercises: [
      { name: 'Norwegian 4x4 Intervals', sets: 4, reps: null, note: '4 min on / 3 min off' },
    ],
  },
  {
    day: 5,
    type: 'Rest',
    rest: true,
    exercises: [],
  },
  {
    day: 6,
    type: 'Push B',
    exercises: [
      { name: 'Dumbbell Incline Press', sets: 4, reps: 10 },
      { name: 'Cable Chest Fly', sets: 3, reps: 12 },
      { name: 'Flat Dumbbell Press', sets: 3, reps: 10 },
      { name: 'Dumbbell Shoulder Press', sets: 4, reps: 10 },
      { name: 'Cable Lateral Raise', sets: 3, reps: 15 },
    ],
  },
  {
    day: 7,
    type: 'Pull B',
    exercises: [
      { name: 'Lat Pulldown wide grip', sets: 4, reps: 10 },
      { name: 'Cable Row', sets: 3, reps: 12 },
      { name: 'Barbell Curl', sets: 4, reps: 10 },
      { name: 'Incline Dumbbell Curl', sets: 3, reps: 12 },
      { name: 'Hammer Curls', sets: 3, reps: 10 },
      { name: 'Ab Work', sets: 3, reps: 15 },
    ],
  },
  {
    day: 8,
    type: 'Legs',
    exercises: [
      { name: 'Squat', sets: 4, reps: 8 },
      { name: 'Romanian Deadlift', sets: 4, reps: 10 },
      { name: 'Leg Press', sets: 3, reps: 12 },
      { name: 'Leg Curl', sets: 3, reps: 12 },
      { name: 'Standing Calf Raise', sets: 4, reps: 15 },
    ],
  },
  {
    day: 9,
    type: 'Rest',
    rest: true,
    exercises: [],
  },
]

export function getWorkoutDay(dayNumber) {
  return WORKOUT_CYCLE.find(w => w.day === dayNumber)
}
