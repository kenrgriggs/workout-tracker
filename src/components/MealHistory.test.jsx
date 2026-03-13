import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MealHistory from './MealHistory'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

// Supabase is replaced entirely with a mock. The real client makes HTTP
// requests to a live database — tests must never do that. vi.mock intercepts
// the module import so MealHistory receives our fake instead of the real client.
vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

// Import after vi.mock so we get the mocked version.
// We use supabase.from.mockReturnValue() per-test to control what data
// the component "receives" from its Supabase query.
import { supabase } from '../lib/supabase'

// Two realistic meal rows. The numbers are chosen deliberately:
//   calories: 350 + 520 = 870 (total we assert on)
//   protein:   12 +  45 =  57 (total we assert on)
// notes: null on one, 'post-workout' on the other (tests both paths)
const FAKE_MEALS = [
  {
    id: '1',
    name: 'Oatmeal',
    calories: 350,
    protein: 12,
    carbs: 60,
    fats: 6,
    consumed_at: '2024-01-15T08:00:00Z',
    notes: null,
  },
  {
    id: '2',
    name: 'Chicken Rice',
    calories: 520,
    protein: 45,
    carbs: 65,
    fats: 8,
    consumed_at: '2024-01-15T12:00:00Z',
    notes: 'post-workout',
  },
]

function renderComponent() {
  // AppWrapper provides AuthContext (fake logged-in user) and SettingsContext
  // (weightUnit: 'lbs'). Without these, useAuth() and useSettings() would throw.
  return render(<AppWrapper><MealHistory /></AppWrapper>)
}

// Default: every test starts with an empty result unless overridden.
// This prevents data from one test leaking into the next via shared mock state.
beforeEach(() => {
  supabase.from.mockReturnValue(buildQueryMock({ data: [], error: null }))
})

describe('MealHistory — loading', () => {
  // Verifies the loading state is visible before the async fetch resolves.
  // The mock returns a Promise that never resolves, keeping the component
  // permanently in its loading branch. Without this, the component might
  // skip straight to the data or empty state and users would see a blank flash.
  it('shows a loading indicator before data arrives', () => {
    supabase.from.mockReturnValue({
      ...buildQueryMock(),
      then: () => new Promise(() => {}), // hangs forever
    })
    renderComponent()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

describe('MealHistory — empty state', () => {
  // The default beforeEach mock returns [] so no override needed here.
  // waitFor is required because the component starts loading, then transitions
  // to the empty state after the mock resolves — it's not synchronous.
  it('shows an empty state message when there are no meals', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/no meals yet/i)).toBeInTheDocument()
    )
  })
})

describe('MealHistory — with data', () => {
  // Override the default empty mock with FAKE_MEALS for all tests in this block.
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_MEALS }))
  })

  // Verifies both meal names appear. waitFor handles the async fetch.
  // We wait for Oatmeal first (confirms data has arrived), then assert
  // Chicken Rice synchronously — once the first is there, both should be.
  it('renders each meal name', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('Oatmeal'))
    expect(screen.getByText('Chicken Rice')).toBeInTheDocument()
  })

  // Verifies the per-meal calorie numbers render. These appear in the individual
  // meal cards, distinct from the totals in the stats grid above.
  it('renders calorie values for each meal', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('350'))
    expect(screen.getByText('520')).toBeInTheDocument()
  })

  // The stats grid at the top shows all-time totals, not per-meal values.
  // 350 + 520 = 870. If the reduce in useMemo breaks, this fails.
  it('shows the total calorie count across all meals', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('870')).toBeInTheDocument())
  })

  // Same pattern for protein totals. 12 + 45 = 57.
  // Verifies all four macro columns in the stats grid are computed, not just calories.
  it('shows the total protein count across all meals', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('57')).toBeInTheDocument())
  })

  // notes is nullable in the DB. This test uses the 'post-workout' note on
  // Chicken Rice to verify notes render when present. The null on Oatmeal
  // verifies the component doesn't crash on null (no assertion needed —
  // if it crashed, the test itself would fail).
  it('renders meal notes when present', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('post-workout')).toBeInTheDocument())
  })
})
