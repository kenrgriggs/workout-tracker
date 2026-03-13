import { describe, it, expect } from 'vitest'
import { WORKOUT_CYCLE, WORKOUT_COLORS, getWorkoutDay } from './workoutDefinitions'

// workoutDefinitions.js is static data — it never changes at runtime.
// Testing it catches accidental edits (a deleted exercise, a renamed type)
// that would silently break the cycle view, workout logging, and color rendering
// without any runtime error.

describe('WORKOUT_CYCLE', () => {
  // The entire app is built around a 9-day cycle. If a day is accidentally
  // added or removed, every "current day" calculation in CycleView breaks.
  it('has exactly 9 days', () => {
    expect(WORKOUT_CYCLE).toHaveLength(9)
  })

  // Day numbers are used as DB values (stored in workouts.day_number).
  // They must start at 1 and be sequential — gaps or duplicates would cause
  // getWorkoutDay() to return the wrong definition for a logged workout.
  it('has sequential day numbers from 1 to 9', () => {
    const days = WORKOUT_CYCLE.map(d => d.day)
    expect(days).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  // workout_type is stored as text in the DB and used as a display label
  // and color map key. An empty or missing type would render a blank badge
  // and fail the WORKOUT_COLORS lookup.
  it('every day has a type string', () => {
    WORKOUT_CYCLE.forEach(day => {
      expect(typeof day.type).toBe('string')
      expect(day.type.length).toBeGreaterThan(0)
    })
  })

  // subtitle appears under the day type in the cycle grid and workout header.
  // Missing subtitles render as undefined in the UI.
  it('every day has a subtitle', () => {
    WORKOUT_CYCLE.forEach(day => {
      expect(typeof day.subtitle).toBe('string')
    })
  })

  // Lift days (not rest, not cardio-only) drive the set-logging UI.
  // A lift day with zero exercises would render an empty workout screen.
  // This also asserts liftDays.length > 0 — if the filter logic is wrong
  // and matches nothing, the inner loop wouldn't run and the test would pass vacuously.
  it('lift days have at least one exercise', () => {
    const liftDays = WORKOUT_CYCLE.filter(d => !d.rest && !d.notesOnly)
    expect(liftDays.length).toBeGreaterThan(0)
    liftDays.forEach(day => {
      expect(day.exercises.length).toBeGreaterThan(0)
    })
  })

  // Rest days must have an empty array (not undefined, not null) because
  // components call .map() on exercises without guarding for missing arrays.
  // Same vacuous-loop guard: assert rest days actually exist.
  it('rest days have an empty exercises array', () => {
    const restDays = WORKOUT_CYCLE.filter(d => d.rest)
    expect(restDays.length).toBeGreaterThan(0)
    restDays.forEach(day => {
      expect(day.exercises).toEqual([])
    })
  })

  // Each exercise object drives one row in the WorkoutView set table.
  // name: displayed as the label. sets/reps: used to pre-populate the logging UI.
  // reps is allowed to be null for cardio entries (e.g. "Easy Run").
  it('exercises on lift days each have a name, sets, and reps', () => {
    const liftDays = WORKOUT_CYCLE.filter(d => !d.rest && !d.notesOnly)
    liftDays.forEach(day => {
      day.exercises.forEach(ex => {
        expect(typeof ex.name).toBe('string')
        expect(typeof ex.sets).toBe('number')
        expect(ex.reps === null || typeof ex.reps === 'number').toBe(true)
      })
    })
  })

  // Cardio-only days (Zone 2, VO2) use notesOnly: true to skip the set-logging UI
  // and show only a notes field instead. If this flag is missing, those days would
  // incorrectly render an exercise grid with a single "Easy Run" row.
  it('notesOnly days have notesOnly set to true', () => {
    const notesOnlyDays = WORKOUT_CYCLE.filter(d => d.notesOnly)
    expect(notesOnlyDays.length).toBeGreaterThan(0)
    notesOnlyDays.forEach(day => {
      expect(day.notesOnly).toBe(true)
    })
  })

  // Pinned: days 2 and 4 are the cardio-only days in this program. If the cycle
  // is reordered, the WorkoutView would show the wrong UI for those days.
  it('days 2 and 4 are notesOnly cardio days', () => {
    expect(getWorkoutDay(2).notesOnly).toBe(true)
    expect(getWorkoutDay(4).notesOnly).toBe(true)
  })

  // Pinned test: days 5 and 9 are specifically the rest days in this program.
  // If the cycle structure is reordered, this fails loudly instead of silently
  // showing a workout screen on what should be a rest day.
  it('days 5 and 9 are rest days', () => {
    expect(getWorkoutDay(5).rest).toBe(true)
    expect(getWorkoutDay(9).rest).toBe(true)
  })
})

describe('getWorkoutDay', () => {
  // Happy path for the first day. Also verifies both .type and .day
  // are present so callers can trust the shape of the returned object.
  it('returns Push A for day 1', () => {
    const day = getWorkoutDay(1)
    expect(day.type).toBe('Push A')
    expect(day.day).toBe(1)
  })

  // Spot-check a cardio day — verifies notesOnly days are accessible by number.
  it('returns Zone 2 for day 2', () => {
    expect(getWorkoutDay(2).type).toBe('Zone 2')
  })

  // Spot-check the leg day — the last lift day before the second rest.
  it('returns Legs for day 8', () => {
    expect(getWorkoutDay(8).type).toBe('Legs')
  })

  // Verifies a rest day returns both .type === 'Rest' and .rest === true.
  // Components check both fields independently, so both must be set.
  it('returns the rest day for day 5', () => {
    const day = getWorkoutDay(5)
    expect(day.type).toBe('Rest')
    expect(day.rest).toBe(true)
  })

  // Out-of-range inputs: the cycle only defines days 1–9.
  // Components must handle undefined returns — if they don't guard, these
  // will surface as runtime crashes in the real app.
  it('returns undefined for day 0', () => {
    expect(getWorkoutDay(0)).toBeUndefined()
  })

  it('returns undefined for day 10', () => {
    expect(getWorkoutDay(10)).toBeUndefined()
  })

  it('returns undefined for a negative day', () => {
    expect(getWorkoutDay(-1)).toBeUndefined()
  })

  // The cycle uses strict equality (===) to match day numbers. A string '1' is not
  // the same as the number 1, so callers must pass numbers, not parsed strings.
  it('returns undefined for a string day number', () => {
    expect(getWorkoutDay('1')).toBeUndefined()
  })
})

describe('WORKOUT_COLORS', () => {
  // The color map is keyed by the exact workout_type strings used in WORKOUT_CYCLE.
  // This test derives the expected keys from the cycle itself — if a new workout
  // type is added to the cycle without a matching color, this test fails.
  // Without this, the UI silently renders `undefined` as the background color.
  it('has a color for every unique workout type in the cycle', () => {
    const types = [...new Set(WORKOUT_CYCLE.map(d => d.type))]
    types.forEach(type => {
      expect(WORKOUT_COLORS[type], `missing color for type "${type}"`).toBeTruthy()
    })
  })

  // All color values must be 6-digit hex strings (#rrggbb).
  // Catches typos like '#ff6b3' (5 digits) or 'orange' that would render
  // as transparent/black in CSS color properties.
  it('all color values are valid CSS hex strings', () => {
    Object.values(WORKOUT_COLORS).forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })
})
