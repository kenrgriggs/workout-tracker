import { useContext } from 'react'
import { SettingsContext } from './SettingsContextValue'

export function useSettings() {
  return useContext(SettingsContext)
}
