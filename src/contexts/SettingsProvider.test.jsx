import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsProvider } from './SettingsContext'
import { useSettings } from './useSettings'

// SettingsProvider manages the weight unit preference (lbs vs kg).
// It's the only piece of global state besides auth — it wraps the whole app.
// These tests verify it reads from localStorage on mount, persists changes back,
// and handles corrupt or missing stored values without crashing.

// SettingsConsumer is a minimal component that renders the context value into
// the DOM so tests can query it. This is the standard RTL pattern for testing
// context providers — we don't test the provider in isolation, we test what
// a consumer would actually see.
function SettingsConsumer() {
  const { weightUnit, setWeightUnit } = useSettings()
  return (
    <div>
      <span data-testid="unit">{weightUnit}</span>
      <button onClick={() => setWeightUnit('kg')}>Switch to kg</button>
      <button onClick={() => setWeightUnit('lbs')}>Switch to lbs</button>
    </div>
  )
}

function renderProvider(ui = <SettingsConsumer />) {
  return render(<SettingsProvider>{ui}</SettingsProvider>)
}

// Each test gets a clean localStorage so stored state from one test
// doesn't leak into the next. Without this, test order would matter.
beforeEach(() => {
  localStorage.clear()
})

describe('SettingsProvider — defaults', () => {
  // First-time user: nothing in localStorage. Must default to lbs, not undefined.
  // If this fails, new users see broken weight displays on first load.
  it('defaults to lbs when no localStorage value exists', () => {
    renderProvider()
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
  })
})

describe('SettingsProvider — localStorage', () => {
  // Returning user who previously chose kg. The provider reads localStorage
  // synchronously during useState initialisation — if it reads it too late
  // (e.g. in a useEffect), the user would briefly see lbs before it corrects.
  it('reads an existing kg preference from localStorage on mount', () => {
    localStorage.setItem('wt_settings', JSON.stringify({ weightUnit: 'kg' }))
    renderProvider()
    expect(screen.getByTestId('unit')).toHaveTextContent('kg')
  })

  // localStorage can contain corrupt data if the user or another script
  // wrote to the key. The provider wraps the parse in try/catch — this
  // verifies the fallback actually works rather than crashing the app.
  it('ignores an invalid localStorage value and falls back to lbs', () => {
    localStorage.setItem('wt_settings', 'not-valid-json')
    renderProvider()
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
  })

  // The provider only accepts 'kg' or 'lbs'. Any other string (including
  // values that could appear if the schema ever changes) falls back to lbs.
  // The check in loadSettings is: stored.weightUnit === 'kg' ? 'kg' : 'lbs'
  it('ignores an unrecognised unit value and falls back to lbs', () => {
    localStorage.setItem('wt_settings', JSON.stringify({ weightUnit: 'stone' }))
    renderProvider()
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
  })
})

describe('SettingsProvider — state updates', () => {
  // Simulates the user clicking "kg" in AccountView. Verifies the context
  // value updates immediately — if it didn't, the UI wouldn't re-render.
  it('updates the displayed unit when setWeightUnit is called', async () => {
    renderProvider()
    await userEvent.click(screen.getByText('Switch to kg'))
    expect(screen.getByTestId('unit')).toHaveTextContent('kg')
  })

  // The useEffect that calls saveSettings fires after the state update.
  // This verifies persistence actually happens — not just the in-memory state.
  // If the user closes and reopens the app, the preference must survive.
  it('persists the updated unit to localStorage', async () => {
    renderProvider()
    await userEvent.click(screen.getByText('Switch to kg'))
    const stored = JSON.parse(localStorage.getItem('wt_settings'))
    expect(stored.weightUnit).toBe('kg')
  })

  // Verifies the toggle is bidirectional. Starts with kg in localStorage,
  // clicks back to lbs, checks both the live state and the persisted value.
  it('can toggle back from kg to lbs', async () => {
    localStorage.setItem('wt_settings', JSON.stringify({ weightUnit: 'kg' }))
    renderProvider()
    await userEvent.click(screen.getByText('Switch to lbs'))
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
    const stored = JSON.parse(localStorage.getItem('wt_settings'))
    expect(stored.weightUnit).toBe('lbs')
  })
})
