import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { AuthContext } from '../../contexts/AuthContextValue'
import { SettingsContext } from '../../contexts/SettingsContextValue'

export const FAKE_USER = { id: 'test-user-id', email: 'test@example.com' }

export function AppWrapper({ children, user = FAKE_USER, weightUnit = 'lbs' }) {
  const authValue = { user, loading: false }
  const settingsValue = { weightUnit, setWeightUnit: vi.fn() }

  return (
    <AuthContext.Provider value={authValue}>
      <SettingsContext.Provider value={settingsValue}>
        {children}
      </SettingsContext.Provider>
    </AuthContext.Provider>
  )
}

export function renderWithProviders(ui, options = {}) {
  const { user, weightUnit, ...renderOptions } = options
  return render(
    <AppWrapper user={user} weightUnit={weightUnit}>
      {ui}
    </AppWrapper>,
    renderOptions,
  )
}
