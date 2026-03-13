import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import HistoryView from './HistoryView'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

// Supabase is replaced entirely with a mock. The real client makes HTTP
// requests to a live database — tests must never do that.
vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

// downloadCSV triggers DOM side effects (creates anchor, fires click) that don't
// work in jsdom. Mocking the function lets us verify it was called with the right
// arguments without dealing with missing browser APIs.
vi.mock('../lib/export', () => ({ downloadCSV: vi.fn() }))

// Import after vi.mock so we get the mocked versions.
import { supabase } from '../lib/supabase'
import { downloadCSV } from '../lib/export'

// Two workout rows. day_number and workout_type are shown in the rendered list.
// 'SKIPPED' on the second verifies the component renders skipped sessions without crashing.
const FAKE_WORKOUTS = [
  { id: 'w1', day_number: 1, workout_type: 'Push A', completed_at: '2024-01-15T10:00:00Z', notes: null },
  { id: 'w2', day_number: 4, workout_type: 'Legs', completed_at: '2024-01-14T10:00:00Z', notes: 'SKIPPED' },
]

// A minimal set row associated with w1. Used only in the export test to give
// the sets query something to join against.
const FAKE_SETS = [
  { workout_id: 'w1', exercise_name: 'Bench Press', set_number: 1, weight_lbs: 135, reps: 10, completed: true },
]

function renderComponent() {
  // AppWrapper provides AuthContext (fake logged-in user) and SettingsContext.
  return render(<AppWrapper><HistoryView /></AppWrapper>)
}

// Default: empty result for every test unless overridden. Prevents state from
// one test leaking into the next via shared mock state.
beforeEach(() => {
  vi.clearAllMocks()
  supabase.from.mockReturnValue(buildQueryMock({ data: [], error: null }))
})

describe('HistoryView — loading', () => {
  // Verifies the loading text is visible before the async fetch resolves.
  // The mock returns a Promise that never resolves, keeping the component
  // permanently in its loading branch.
  it('shows a loading indicator before data arrives', () => {
    supabase.from.mockReturnValue({
      ...buildQueryMock(),
      then: () => new Promise(() => {}), // hangs forever
    })
    renderComponent()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

describe('HistoryView — empty state', () => {
  // Default beforeEach returns [] so no override needed.
  it('shows an empty state message when there are no workouts', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/no workouts logged yet/i)).toBeInTheDocument()
    )
  })
})

describe('HistoryView — with data', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_WORKOUTS }))
  })

  // Verifies both workout_type values appear in the rendered list.
  // getAllByText is required because each type renders in two places per card:
  // once in the TypeBadge span and once in the workout_type paragraph.
  it('renders workout type names', async () => {
    renderComponent()
    await waitFor(() => screen.getAllByText('Push A'))
    expect(screen.getAllByText('Legs').length).toBeGreaterThan(0)
  })

  // The export button only appears once workouts exist.
  it('shows the export button when workouts are loaded', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('Export CSV')).toBeInTheDocument())
  })
})

describe('HistoryView — export', () => {
  // Verifies that clicking Export CSV results in downloadCSV being called with
  // the correct filename. Uses mockReturnValueOnce to sequence three separate
  // supabase calls: initial load, export workouts query, export sets query.
  it('clicking Export CSV calls downloadCSV with workouts.csv', async () => {
    supabase.from
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_WORKOUTS })) // initial load
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_WORKOUTS })) // export: workouts
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_SETS }))     // export: sets

    renderComponent()
    await waitFor(() => screen.getByText('Export CSV'))
    fireEvent.click(screen.getByText('Export CSV'))

    await waitFor(() =>
      expect(downloadCSV).toHaveBeenCalledWith('workouts.csv', expect.any(Array), expect.any(Array))
    )
  })
})
