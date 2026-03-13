import { describe, it, expect } from 'vitest'
import { lbsToUnit, unitToLbs, WEIGHT_UNITS } from './units'

// units.js is the single place responsible for weight display throughout the app.
// All weights are stored in the database as lbs. These functions convert for display
// based on the user's preference. If they break, every weight shown in the UI is wrong.

describe('lbsToUnit', () => {
  // The default unit is lbs. When the user hasn't switched to kg, the value
  // should pass through untouched — no conversion, no rounding surprises.
  it('returns the value unchanged when unit is lbs', () => {
    expect(lbsToUnit(100, WEIGHT_UNITS.LBS)).toBe(100)
  })

  // Core conversion: 100 lbs × 0.45359237 = 45.359237, rounded to 45.4.
  // This is the number a user sees next to every set they've logged.
  it('converts lbs to kg', () => {
    expect(lbsToUnit(100, WEIGHT_UNITS.KG)).toBe(45.4)
  })

  // Verifies rounding specifically — a different input that produces a
  // non-obvious rounded result. Catches off-by-one errors in the rounding logic.
  it('rounds to one decimal place', () => {
    expect(lbsToUnit(155, WEIGHT_UNITS.KG)).toBe(70.3)
  })

  // 0 is a legitimate weight (bodyweight exercises). The function guards against
  // falsy values with `if (value == null || value === '')` — 0 is falsy in JS
  // but is NOT null or empty string, so it must not be swallowed.
  it('handles 0 without returning empty string', () => {
    expect(lbsToUnit(0, WEIGHT_UNITS.LBS)).toBe(0)
  })

  // A set with no weight logged stores null in the DB. The UI renders '' (empty)
  // rather than "0" or "null" so input fields appear blank, not pre-filled.
  it('returns empty string for null', () => {
    expect(lbsToUnit(null, WEIGHT_UNITS.LBS)).toBe('')
  })

  // Defensive: undefined can occur if a set row is partially formed before saving.
  it('returns empty string for undefined', () => {
    expect(lbsToUnit(undefined, WEIGHT_UNITS.LBS)).toBe('')
  })

  // Empty string comes from a cleared input field. Should remain empty, not coerce to 0.
  it('returns empty string for empty string', () => {
    expect(lbsToUnit('', WEIGHT_UNITS.KG)).toBe('')
  })

  // If someone passes a non-numeric string, Number() returns NaN which fails
  // isFinite. Should degrade gracefully to empty rather than displaying "NaN".
  it('returns empty string for non-numeric input', () => {
    expect(lbsToUnit('heavy', WEIGHT_UNITS.LBS)).toBe('')
  })
})

describe('unitToLbs', () => {
  // Inverse of lbsToUnit for lbs: pass-through with no mutation.
  it('returns the value unchanged when unit is lbs', () => {
    expect(unitToLbs(100, WEIGHT_UNITS.LBS)).toBe(100)
  })

  // This is the write path: when a user types a weight in kg, it gets converted
  // back to lbs before being saved to the DB. 45.4 kg → 100.09... → 100.1 lbs.
  it('converts kg to lbs', () => {
    expect(unitToLbs(45.4, WEIGHT_UNITS.KG)).toBe(100.1)
  })

  // Another specific rounding case for the write path.
  it('rounds to one decimal place', () => {
    expect(unitToLbs(70, WEIGHT_UNITS.KG)).toBe(154.3)
  })

  // Same null/empty/invalid guards as lbsToUnit — the write path needs them too.
  it('returns empty string for null', () => {
    expect(unitToLbs(null, WEIGHT_UNITS.KG)).toBe('')
  })

  // Mirrors the lbsToUnit undefined test — undefined can appear on partially-formed set rows.
  it('returns empty string for undefined', () => {
    expect(unitToLbs(undefined, WEIGHT_UNITS.KG)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(unitToLbs('', WEIGHT_UNITS.LBS)).toBe('')
  })

  it('returns empty string for non-numeric input', () => {
    expect(unitToLbs('light', WEIGHT_UNITS.KG)).toBe('')
  })

  // 0 kg is a valid bodyweight entry. Same falsy-value trap as lbsToUnit(0).
  it('handles 0 without returning empty string', () => {
    expect(unitToLbs(0, WEIGHT_UNITS.KG)).toBe(0)
  })
})

describe('unknown unit fallback', () => {
  // Both functions fall through to lbs behavior when the unit is not 'kg'.
  // This covers typos, future refactors, or a corrupted settings value reaching
  // these functions — the UI should still display a number rather than crashing.
  it('lbsToUnit defaults to lbs pass-through for an unrecognized unit', () => {
    expect(lbsToUnit(100, 'stones')).toBe(100)
  })

  it('unitToLbs defaults to lbs pass-through for an unrecognized unit', () => {
    expect(unitToLbs(100, 'stones')).toBe(100)
  })
})

describe('round-trip conversion', () => {
  // Both functions round to one decimal place, so converting lbs → kg → lbs
  // will accumulate rounding error. This test verifies the drift stays within
  // 0.2 lbs — imperceptible for gym purposes. If someone tightens the rounding
  // in one function but not the other, this catches the asymmetry.
  it('converts lbs → kg → lbs with acceptable rounding error', () => {
    const original = 200
    const kg = lbsToUnit(original, WEIGHT_UNITS.KG)
    const backToLbs = unitToLbs(kg, WEIGHT_UNITS.KG)
    expect(Math.abs(backToLbs - original)).toBeLessThan(0.2)
  })
})
