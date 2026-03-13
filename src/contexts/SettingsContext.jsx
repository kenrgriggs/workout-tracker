import { useEffect, useState } from 'react'
import { SettingsContext } from './SettingsContextValue'

const STORAGE_KEY = 'wt_settings'

function loadSettings() {
  // `typeof window === 'undefined'` guard is defensive for SSR environments.
  // This app is a pure client-side SPA, but the guard prevents crashes in test
  // environments that run in Node without a DOM.
  if (typeof window === 'undefined') return { weightUnit: 'lbs' }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      // Explicit allowlist: any stored value other than 'kg' defaults to 'lbs'.
      // This ensures corrupted or outdated localStorage data degrades safely.
      weightUnit: stored.weightUnit === 'kg' ? 'kg' : 'lbs',
    }
  } catch {
    // JSON.parse can throw if localStorage contains a non-JSON string
    // left by a previous version of the app.
    return { weightUnit: 'lbs' }
  }
}

function saveSettings(settings) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function SettingsProvider({ children }) {
  // Lazy initializer reads localStorage once at mount, not on every render.
  const [weightUnit, setWeightUnit] = useState(() => loadSettings().weightUnit)

  // Keep localStorage in sync whenever the preference changes.
  useEffect(() => {
    saveSettings({ weightUnit })
  }, [weightUnit])

  return (
    <SettingsContext.Provider value={{ weightUnit, setWeightUnit }}>
      {children}
    </SettingsContext.Provider>
  )
}
