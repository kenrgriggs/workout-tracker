export const WORKOUT_COLORS = {
  'Push A': '#ff6b35',
  'Push B': '#ff6b35',
  'Pull A': '#4af0ff',
  'Pull B': '#4af0ff',
  'Legs': '#e8ff4a',
  'VO2': '#ff3b3b',
  'Zone 2': '#a78bfa',
  'Rest': '#444444',
}

export const WORKOUT_CYCLE = [
  {
    day: 1,
    type: 'Push A',
    subtitle: 'Chest / Shoulders',
    duration: '~55 min lifting + 20 min zone 2',
    timing: [
      { label: 'Warmup', value: '5 min' },
      { label: 'Work sets', value: '~45 min' },
      { label: 'Cardio', value: '20 min zone 2' },
      { label: 'Rest btw sets', value: '60–90s' },
    ],
    exercises: [
      { name: 'Incline Bench Press', sets: 4, reps: 10, muscles: ['Upper chest'], note: 'Primary chest movement. 2–3 RIR.' },
      { name: 'Flat Bench Press', sets: 3, reps: 10, muscles: ['Chest'], note: 'Drop to 3 sets — already hitting chest hard above.' },
      { name: 'Machine Flyes', sets: 3, reps: 12, muscles: ['Chest'], note: 'Stretch focus. Control the eccentric.' },
      { name: 'Overhead Press', sets: 4, reps: 10, muscles: ['Delts'], note: 'Primary shoulder movement.' },
      { name: 'Side Lateral Raises', sets: 3, reps: 15, muscles: ['Side delts'], note: 'Higher reps work well here. Slight forward lean.' },
      { name: 'Ab Work', sets: 3, reps: 15, muscles: ['Core'], note: "Captain's chair or cable crunch." },
    ],
  },
  {
    day: 2,
    type: 'Zone 2',
    subtitle: 'Aerobic base',
    duration: '45–60 min easy running',
    notesOnly: true,
    exercises: [
      { name: 'Easy Run', sets: 1, reps: null, note: '45–60 min · 60–70% max HR · fully conversational' },
    ],
  },
  {
    day: 3,
    type: 'Pull A',
    subtitle: 'Back / Biceps / Rear Delts',
    duration: '~55 min lifting + 20 min zone 2',
    timing: [
      { label: 'Warmup', value: '5 min' },
      { label: 'Work sets', value: '~45 min' },
      { label: 'Cardio', value: '20 min zone 2' },
    ],
    exercises: [
      { name: 'Barbell Row', sets: 4, reps: 10, muscles: ['Lats', 'Mid-back'], note: 'Horizontal pull. Primary compound.' },
      { name: 'Lat Pulldown', sets: 4, reps: 10, muscles: ['Lats'], note: 'Vertical pull. Full stretch at top.' },
      { name: 'Seated Cable Row', sets: 3, reps: 12, muscles: ['Mid-back', 'Rhomboids'], note: 'Squeeze at peak contraction.' },
      { name: 'Face Pulls', sets: 3, reps: 15, muscles: ['Rear delts', 'Rotator cuff'], note: 'Rear delt health. External rotation emphasis.' },
      { name: 'Barbell Curl', sets: 3, reps: 10, muscles: ['Biceps'], note: 'Supinate at top.' },
      { name: 'Hammer Curls', sets: 3, reps: 10, muscles: ['Brachialis', 'Forearms'], note: 'Brachialis adds arm thickness.' },
    ],
  },
  {
    day: 4,
    type: 'VO2',
    subtitle: 'Norwegian 4×4 Intervals',
    duration: '~40 min total',
    notesOnly: true,
    exercises: [
      { name: 'Norwegian 4×4 Intervals', sets: 4, reps: null, note: '10 min warmup → 4 min hard (90–95% max HR) / 3 min easy × 4 rounds → 5 min cooldown' },
    ],
  },
  {
    day: 5,
    type: 'Rest',
    subtitle: 'Recovery',
    duration: 'Full rest',
    rest: true,
    exercises: [],
  },
  {
    day: 6,
    type: 'Push B',
    subtitle: 'Chest / Shoulders (Variation)',
    duration: '~55 min lifting + 20 min zone 2',
    timing: [
      { label: 'Warmup', value: '5 min' },
      { label: 'Work sets', value: '~45 min' },
      { label: 'Cardio', value: '20 min zone 2' },
    ],
    exercises: [
      { name: 'Dumbbell Incline Press', sets: 4, reps: 10, muscles: ['Upper chest'], note: 'Greater ROM than barbell. Second chest session.' },
      { name: 'Cable Chest Fly', sets: 3, reps: 12, muscles: ['Upper chest'], note: 'Constant tension. Really stretch into it.' },
      { name: 'Flat Dumbbell Press', sets: 3, reps: 10, muscles: ['Chest'], note: 'Greater stretch at bottom vs barbell.' },
      { name: 'Dumbbell Shoulder Press', sets: 4, reps: 10, muscles: ['Delts'], note: 'Neutral grip reduces shoulder stress.' },
      { name: 'Cable Lateral Raise', sets: 3, reps: 15, muscles: ['Side delts'], note: 'Cable keeps tension at full stretch.' },
    ],
  },
  {
    day: 7,
    type: 'Pull B',
    subtitle: 'Biceps Focus / Back Width',
    duration: '~50 min lifting + 20 min zone 2',
    timing: [
      { label: 'Warmup', value: '5 min' },
      { label: 'Work sets', value: '~40 min' },
      { label: 'Cardio', value: '20 min zone 2' },
    ],
    exercises: [
      { name: 'Lat Pulldown wide grip', sets: 4, reps: 10, muscles: ['Lats'], note: 'Pull elbows down, not just the bar.' },
      { name: 'Cable Row', sets: 3, reps: 12, muscles: ['Lats', 'Mid-back'], note: 'Squeeze at peak contraction.' },
      { name: 'Barbell Curl', sets: 4, reps: 10, muscles: ['Biceps'], note: 'Go heavier than Pull A — priority session.' },
      { name: 'Incline Dumbbell Curl', sets: 3, reps: 12, muscles: ['Biceps'], note: 'Stretched position = high growth stimulus. Slow eccentric.' },
      { name: 'Hammer Curls', sets: 3, reps: 10, muscles: ['Brachialis', 'Forearms'], note: 'Brachialis adds thickness under the bicep.' },
      { name: 'Ab Work', sets: 3, reps: 15, muscles: ['Core'], note: 'Cable crunch or hanging leg raise. Well-spaced from Push A.' },
    ],
  },
  {
    day: 8,
    type: 'Legs',
    subtitle: 'Quads / Hamstrings / Glutes / Calves',
    duration: '~55 min lifting + 20 min zone 2',
    timing: [
      { label: 'Warmup', value: '5 min' },
      { label: 'Work sets', value: '~45 min' },
      { label: 'Cardio', value: '20 min zone 2' },
    ],
    exercises: [
      { name: 'Squat', sets: 4, reps: 8, muscles: ['Quads', 'Glutes'], note: 'Slightly lower rep range — load it.' },
      { name: 'Romanian Deadlift', sets: 4, reps: 10, muscles: ['Hamstrings', 'Glutes'], note: 'Hip hinge. Full hamstring stretch at bottom.' },
      { name: 'Leg Press', sets: 3, reps: 12, muscles: ['Quads'], note: 'Feet high = more glutes. Feet low = more quads.' },
      { name: 'Leg Curl', sets: 3, reps: 12, muscles: ['Hamstrings'], note: 'Isolation for hamstrings.' },
      { name: 'Standing Calf Raise', sets: 4, reps: 15, muscles: ['Calves'], note: 'Full ROM. Slow eccentric.' },
    ],
  },
  {
    day: 9,
    type: 'Rest',
    subtitle: 'Recovery',
    duration: 'Full rest',
    rest: true,
    exercises: [],
  },
]

export function getWorkoutDay(dayNumber) {
  return WORKOUT_CYCLE.find(w => w.day === dayNumber)
}
