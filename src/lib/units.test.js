import { describe, it, expect } from 'vitest'
import { lbsToUnit, unitToLbs, WEIGHT_UNITS } from './units'

describe('lbsToUnit', () => {
  it('returns the value unchanged when unit is lbs', () => {
    expect(lbsToUnit(100, WEIGHT_UNITS.LBS)).toBe(100)
  })

  it('converts lbs to kg', () => {
    expect(lbsToUnit(100, WEIGHT_UNITS.KG)).toBe(45.4)
  })

  it('rounds to one decimal place', () => {
    expect(lbsToUnit(155, WEIGHT_UNITS.KG)).toBe(70.3)
  })

  it('handles 0 without returning empty string', () => {
    expect(lbsToUnit(0, WEIGHT_UNITS.LBS)).toBe(0)
  })

  it('returns empty string for null', () => {
    expect(lbsToUnit(null, WEIGHT_UNITS.LBS)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(lbsToUnit(undefined, WEIGHT_UNITS.LBS)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(lbsToUnit('', WEIGHT_UNITS.KG)).toBe('')
  })

  it('returns empty string for non-numeric input', () => {
    expect(lbsToUnit('heavy', WEIGHT_UNITS.LBS)).toBe('')
  })
})

describe('unitToLbs', () => {
  it('returns the value unchanged when unit is lbs', () => {
    expect(unitToLbs(100, WEIGHT_UNITS.LBS)).toBe(100)
  })

  it('converts kg to lbs', () => {
    // 45.4 kg → 100.09... → rounded to 100.1
    expect(unitToLbs(45.4, WEIGHT_UNITS.KG)).toBe(100.1)
  })

  it('rounds to one decimal place', () => {
    expect(unitToLbs(70, WEIGHT_UNITS.KG)).toBe(154.3)
  })

  it('returns empty string for null', () => {
    expect(unitToLbs(null, WEIGHT_UNITS.KG)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(unitToLbs('', WEIGHT_UNITS.LBS)).toBe('')
  })

  it('returns empty string for non-numeric input', () => {
    expect(unitToLbs('light', WEIGHT_UNITS.KG)).toBe('')
  })
})

describe('round-trip conversion', () => {
  it('converts lbs → kg → lbs with acceptable rounding error', () => {
    const original = 200
    const kg = lbsToUnit(original, WEIGHT_UNITS.KG)
    const backToLbs = unitToLbs(kg, WEIGHT_UNITS.KG)
    // Allow ±0.2 lbs of rounding drift from two decimal-place roundings
    expect(Math.abs(backToLbs - original)).toBeLessThan(0.2)
  })
})
