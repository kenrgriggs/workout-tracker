import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AccountView from './AccountView'
import { AppWrapper, FAKE_USER } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

// AccountView uses supabase.from (for export) and supabase.auth (for password
// change and sign-out). Both must be mocked.
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock('../lib/export', () => ({ downloadCSV: vi.fn() }))

import { supabase } from '../lib/supabase'
import { downloadCSV } from '../lib/export'

const FAKE_WORKOUTS = [
  { id: 'w1', day_number: 1, workout_type: 'Push A', completed_at: '2024-01-15T10:00:00Z', notes: null },
]

const FAKE_SETS = [
  { workout_id: 'w1', exercise_name: 'Bench Press', set_number: 1, weight_lbs: 135, reps: 10, completed: true },
]

const FAKE_MEALS = [
  { id: 'm1', name: 'Oatmeal', calories: 350, protein: 12, carbs: 60, fats: 6, consumed_at: '2024-01-15T08:00:00Z', notes: null },
]

function renderComponent() {
  return render(<AppWrapper><AccountView /></AppWrapper>)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AccountView — basic rendering', () => {
  // The email in FAKE_USER is the logged-in user's email — it should always be visible.
  it('displays the logged-in user email', () => {
    renderComponent()
    expect(screen.getByText(FAKE_USER.email)).toBeInTheDocument()
  })

  // The export button should always be present regardless of data state,
  // since AccountView doesn't fetch data on mount.
  it('shows the Export All Data button', () => {
    renderComponent()
    expect(screen.getByText('Export All Data')).toBeInTheDocument()
  })
})

describe('AccountView — export', () => {
  // exportAll makes three sequential supabase.from calls: workouts, sets, meals.
  // Verify that downloadCSV is called twice — once for workouts.csv and once
  // for nutrition.csv — confirming both halves of the export run.
  it('clicking Export All Data calls downloadCSV for workouts and nutrition', async () => {
    supabase.from
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_WORKOUTS })) // workouts query
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_SETS }))     // sets query
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_MEALS }))    // meals query

    renderComponent()
    fireEvent.click(screen.getByText('Export All Data'))

    await waitFor(() => {
      expect(downloadCSV).toHaveBeenCalledWith('workouts.csv', expect.any(Array), expect.any(Array))
      expect(downloadCSV).toHaveBeenCalledWith('nutrition.csv', expect.any(Array), expect.any(Array))
    })
  })
})
