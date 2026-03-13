export const WEIGHT_UNITS = {
  LBS: 'lbs',
  KG: 'kg',
}

// Converts a value stored in the DB (always lbs) to the user's preferred display unit.
// The DB is the single source of truth in lbs; this is a pure display transform.
export function lbsToUnit(value, unit) {
  // `== null` catches both null (from DB) and undefined. `=== ''` catches empty
  // strings from form inputs not yet filled in.
  if (value == null || value === '') return ''
  const lbs = Number(value)
  if (!Number.isFinite(lbs)) return ''

  if (unit === WEIGHT_UNITS.KG) {
    // 0.45359237 is the exact NIST factor. Rounded to 1 decimal to match input field precision.
    return Math.round((lbs * 0.45359237) * 10) / 10
  }

  // default to lbs
  return Math.round(lbs * 10) / 10
}

// Converts a value the user typed (in their preferred unit) back to lbs for DB storage.
// Inverse of lbsToUnit — called on form submit, not on display.
export function unitToLbs(value, unit) {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (!Number.isFinite(num)) return ''

  if (unit === WEIGHT_UNITS.KG) {
    return Math.round((num / 0.45359237) * 10) / 10
  }

  return Math.round(num * 10) / 10
}
