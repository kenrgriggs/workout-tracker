import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsProvider } from './SettingsContext'
import { useSettings } from './useSettings'

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

beforeEach(() => {
  localStorage.clear()
})

describe('SettingsProvider — defaults', () => {
  it('defaults to lbs when no localStorage value exists', () => {
    renderProvider()
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
  })
})

describe('SettingsProvider — localStorage', () => {
  it('reads an existing kg preference from localStorage on mount', () => {
    localStorage.setItem('wt_settings', JSON.stringify({ weightUnit: 'kg' }))
    renderProvider()
    expect(screen.getByTestId('unit')).toHaveTextContent('kg')
  })

  it('ignores an invalid localStorage value and falls back to lbs', () => {
    localStorage.setItem('wt_settings', 'not-valid-json')
    renderProvider()
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
  })

  it('ignores an unrecognised unit value and falls back to lbs', () => {
    localStorage.setItem('wt_settings', JSON.stringify({ weightUnit: 'stone' }))
    renderProvider()
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
  })
})

describe('SettingsProvider — state updates', () => {
  it('updates the displayed unit when setWeightUnit is called', async () => {
    renderProvider()
    await userEvent.click(screen.getByText('Switch to kg'))
    expect(screen.getByTestId('unit')).toHaveTextContent('kg')
  })

  it('persists the updated unit to localStorage', async () => {
    renderProvider()
    await userEvent.click(screen.getByText('Switch to kg'))
    const stored = JSON.parse(localStorage.getItem('wt_settings'))
    expect(stored.weightUnit).toBe('kg')
  })

  it('can toggle back from kg to lbs', async () => {
    localStorage.setItem('wt_settings', JSON.stringify({ weightUnit: 'kg' }))
    renderProvider()
    await userEvent.click(screen.getByText('Switch to lbs'))
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
    const stored = JSON.parse(localStorage.getItem('wt_settings'))
    expect(stored.weightUnit).toBe('lbs')
  })
})
