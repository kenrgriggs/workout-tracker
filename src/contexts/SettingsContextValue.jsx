import { createContext } from 'react'

// The default value here acts as a safe fallback for any component rendered
// outside SettingsProvider (e.g., in isolated unit tests that don't wrap with
// the provider). In normal app usage this default is never used.
export const SettingsContext = createContext({
  weightUnit: 'lbs',
  setWeightUnit: () => {},
})
