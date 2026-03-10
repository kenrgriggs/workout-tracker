import { createContext } from 'react'

export const SettingsContext = createContext({
  weightUnit: 'lbs',
  setWeightUnit: () => {},
})
