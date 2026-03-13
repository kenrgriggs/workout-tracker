import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import AnalyticsView from './AnalyticsView'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

// downloadCSV has DOM side effects that don't work in jsdom — mock it.
vi.mock('../lib/export', () => ({ downloadCSV: vi.fn() }))

import { supabase } from '../lib/supabase'
import { downloadCSV } from '../lib/export'

// AnalyticsView fetches workouts then sets in two sequential supabase calls.
// This component excludes SKIPPED workouts server-side via .neq('notes', 'SKIPPED'),
// so FAKE_WORKOUTS only needs non-skipped entries.
const FAKE_WORKOUTS = [
  { id: 'w1', completed_at: '2024-01-15T10:00:00Z' },
  { id: 'w2', completed_at: '2024-01-14T10:00:00Z' },
  { id: 'w3', completed_at: '2024-01-13T10:00:00Z' },
]

const FAKE_SETS = [
  { exercise_name: 'Bench Press', weight_lbs: 135, reps: 10, completed: true },
  { exercise_name: 'Squat', weight_lbs: 185, reps: 8, completed: true },
]

// Separate fixtures for the export queries, which select more columns than
// the analytics queries.
const FAKE_WORKOUTS_FULL = [
  { id: 'w1', day_number: 1, workout_type: 'Push A', completed_at: '2024-01-15T10:00:00Z', notes: null },
]

const FAKE_SETS_FULL = [
  { workout_id: 'w1', exercise_name: 'Bench Press', set_number: 1, weight_lbs: 135, reps: 10, completed: true },
]

function renderComponent() {
  return render(<AppWrapper><AnalyticsView /></AppWrapper>)
}

// Default: empty results for both analytics queries (workouts + sets).
beforeEach(() => {
  vi.clearAllMocks()
  supabase.from.mockReturnValue(buildQueryMock({ data: [] }))
})

describe('AnalyticsView — loading', () => {
  // The analytics useEffect fires two queries. If the first hangs, loading stays true.
  it('shows a loading indicator before data arrives', () => {
    supabase.from.mockReturnValue({
      ...buildQueryMock(),
      then: () => new Promise(() => {}), // hangs forever
    })
    renderComponent()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

describe('AnalyticsView — with data', () => {
  // Provide data for both analytics queries in order: workouts first, sets second.
  beforeEach(() => {
    supabase.from
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_WORKOUTS }))
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_SETS }))
  })

  // totalWorkouts is the count of non-skipped workout rows returned.
  // FAKE_WORKOUTS has 3 entries → the "Total Workouts" stat should show 3.
  it('renders the total workout count in the stats grid', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument())
  })

  // The export button is always rendered at the bottom of the analytics page.
  it('shows the export button', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText('Export Workouts CSV')).toBeInTheDocument()
    )
  })
})

describe('AnalyticsView — export', () => {
  // Four sequential supabase calls: two for analytics load, two for export.
  // mockReturnValueOnce chains consume mocks in call order.
  it('clicking Export Workouts CSV calls downloadCSV with workouts.csv', async () => {
    supabase.from
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_WORKOUTS }))      // analytics: workouts
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_SETS }))          // analytics: sets
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_WORKOUTS_FULL })) // export: workouts
      .mockReturnValueOnce(buildQueryMock({ data: FAKE_SETS_FULL }))     // export: sets

    renderComponent()
    await waitFor(() => screen.getByText('Export Workouts CSV'))
    fireEvent.click(screen.getByText('Export Workouts CSV'))

    await waitFor(() =>
      expect(downloadCSV).toHaveBeenCalledWith('workouts.csv', expect.any(Array), expect.any(Array))
    )
  })
})
