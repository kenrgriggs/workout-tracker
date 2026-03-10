import { useEffect, useState } from 'react'
import { SettingsContext } from './SettingsContextValue'

const STORAGE_KEY = 'wt_settings'

function loadSettings() {
  if (typeof window === 'undefined') return { weightUnit: 'lbs' }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      weightUnit: stored.weightUnit === 'kg' ? 'kg' : 'lbs',
    }
  } catch {
    return { weightUnit: 'lbs' }
  }
}

function saveSettings(settings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function SettingsProvider({ children }) {
  const [weightUnit, setWeightUnit] = useState(() => loadSettings().weightUnit)

  useEffect(() => {
    saveSettings({ weightUnit })
  }, [weightUnit])

  return (
    <SettingsContext.Provider value={{ weightUnit, setWeightUnit }}>
      {children}
    </SettingsContext.Provider>
  )
}
