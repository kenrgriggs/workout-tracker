export const WEIGHT_UNITS = {
  LBS: 'lbs',
  KG: 'kg',
}

export function lbsToUnit(value, unit) {
  if (value == null || value === '') return ''
  const lbs = Number(value)
  if (!Number.isFinite(lbs)) return ''

  if (unit === WEIGHT_UNITS.KG) {
    return Math.round((lbs * 0.45359237) * 10) / 10
  }

  // default to lbs
  return Math.round(lbs * 10) / 10
}

export function unitToLbs(value, unit) {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (!Number.isFinite(num)) return ''

  if (unit === WEIGHT_UNITS.KG) {
    return Math.round((num / 0.45359237) * 10) / 10
  }

  return Math.round(num * 10) / 10
}
