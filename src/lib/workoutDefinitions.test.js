import { describe, it, expect } from 'vitest'
import { WORKOUT_CYCLE, WORKOUT_COLORS, getWorkoutDay } from './workoutDefinitions'

describe('WORKOUT_CYCLE', () => {
  it('has exactly 9 days', () => {
    expect(WORKOUT_CYCLE).toHaveLength(9)
  })

  it('has sequential day numbers from 1 to 9', () => {
    const days = WORKOUT_CYCLE.map(d => d.day)
    expect(days).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('every day has a type string', () => {
    WORKOUT_CYCLE.forEach(day => {
      expect(typeof day.type).toBe('string')
      expect(day.type.length).toBeGreaterThan(0)
    })
  })

  it('every day has a subtitle', () => {
    WORKOUT_CYCLE.forEach(day => {
      expect(typeof day.subtitle).toBe('string')
    })
  })

  it('lift days have at least one exercise', () => {
    const liftDays = WORKOUT_CYCLE.filter(d => !d.rest && !d.notesOnly)
    expect(liftDays.length).toBeGreaterThan(0)
    liftDays.forEach(day => {
      expect(day.exercises.length).toBeGreaterThan(0)
    })
  })

  it('rest days have an empty exercises array', () => {
    const restDays = WORKOUT_CYCLE.filter(d => d.rest)
    expect(restDays.length).toBeGreaterThan(0)
    restDays.forEach(day => {
      expect(day.exercises).toEqual([])
    })
  })

  it('exercises on lift days each have a name, sets, and reps', () => {
    const liftDays = WORKOUT_CYCLE.filter(d => !d.rest && !d.notesOnly)
    liftDays.forEach(day => {
      day.exercises.forEach(ex => {
        expect(typeof ex.name).toBe('string')
        expect(typeof ex.sets).toBe('number')
        // reps can be null for cardio-style entries
        expect(ex.reps === null || typeof ex.reps === 'number').toBe(true)
      })
    })
  })

  it('days 5 and 9 are rest days', () => {
    expect(getWorkoutDay(5).rest).toBe(true)
    expect(getWorkoutDay(9).rest).toBe(true)
  })
})

describe('getWorkoutDay', () => {
  it('returns Push A for day 1', () => {
    const day = getWorkoutDay(1)
    expect(day.type).toBe('Push A')
    expect(day.day).toBe(1)
  })

  it('returns Zone 2 for day 2', () => {
    expect(getWorkoutDay(2).type).toBe('Zone 2')
  })

  it('returns Legs for day 8', () => {
    expect(getWorkoutDay(8).type).toBe('Legs')
  })

  it('returns the rest day for day 5', () => {
    const day = getWorkoutDay(5)
    expect(day.type).toBe('Rest')
    expect(day.rest).toBe(true)
  })

  it('returns undefined for day 0', () => {
    expect(getWorkoutDay(0)).toBeUndefined()
  })

  it('returns undefined for day 10', () => {
    expect(getWorkoutDay(10)).toBeUndefined()
  })

  it('returns undefined for a negative day', () => {
    expect(getWorkoutDay(-1)).toBeUndefined()
  })
})

describe('WORKOUT_COLORS', () => {
  it('has a color for every unique workout type in the cycle', () => {
    const types = [...new Set(WORKOUT_CYCLE.map(d => d.type))]
    types.forEach(type => {
      expect(WORKOUT_COLORS[type], `missing color for type "${type}"`).toBeTruthy()
    })
  })

  it('all color values are valid CSS hex strings', () => {
    Object.values(WORKOUT_COLORS).forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })
})
