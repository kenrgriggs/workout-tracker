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

// The full program is defined here as static JS rather than stored in the database.
// The cycle structure is fixed and identical for every user, so there's no value in
// persisting it. Keeping it in code means changes are version-controlled and don't
// require a DB migration.
//
// Shape of each day:
//   day         — 1-based integer used as the DB key and for display
//   type        — string stored in workouts.workout_type; also the key for WORKOUT_COLORS
//   rest        — if true, WorkoutView renders a rest-day screen with no exercise logging
//   notesOnly   — if true, WorkoutView renders a cardio/freeform notes screen (no set logging)
//   exercises   — array used both for the program reference view and for generating set rows in WorkoutView
export const WORKOUT_CYCLE = [
  {
    day: 1,
    type: 'Push A',
    subtitle: 'Chest / Shoulders',
    description: 'Chest and shoulders are the focus — triceps get indirect work from every pressing movement without dedicated sets.',
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
    description: 'Zone 2 builds your aerobic base, improves mitochondrial density, and enhances fat oxidation. Also aids recovery after Push A. This is intentionally easy — you should be able to hold a full conversation. Most people run Zone 2 too fast.',
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
    description: 'Horizontal and vertical pulling combined. Back volume is the priority — biceps work hard as a secondary mover on every compound pull.',
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
    description: "If you don't have a HR monitor, use perceived effort. Zone 5 should feel like a 9/10 — you can run but not sprint, and you cannot hold a conversation. By the 3rd or 4th interval, the 4-minute hard effort should feel genuinely brutal. If it doesn't, go faster.",
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
    description: 'Push A is barbell-dominant and heavier. Push B shifts to dumbbells and cables to hit different angles and reduce joint stress from identical loading patterns.',
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
    description: 'Biceps are a priority. Pull A handles back volume with biceps as a secondary. Pull B flips that — biceps are the headline, back width is the support. Abs slot in here too, giving you a solid gap from Push A.',
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
    description: 'Full lower body session. Squat is the primary compound — go heavier with slightly lower reps. Romanian deadlift is the hamstring anchor. Zone 2 after is fine at a walk given the leg fatigue.',
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

// `find` instead of array index because `day` is 1-based, not 0-based.
export function getWorkoutDay(dayNumber) {
  return WORKOUT_CYCLE.find(w => w.day === dayNumber)
}
