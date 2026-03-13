import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import CycleView from './CycleView'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'

function renderComponent(props = {}) {
  return render(
    <AppWrapper>
      <CycleView onSelectDay={vi.fn()} {...props} />
    </AppWrapper>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  supabase.from.mockReturnValue(buildQueryMock({ data: [], error: null }))
})

// --- Cycle position calculation ---

describe('CycleView — cycle position', () => {
  it('shows Day 1 as Up Next when there is no workout history', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('Up Next')).toBeInTheDocument())
    // The "Up Next" span appears only on the current-day pill; verify it's Day 1
    const upNext = screen.getByText('Up Next')
    expect(upNext.closest('button')).toHaveTextContent('Push A')
  })

  it('advances to Day 4 after completing Day 3', async () => {
    supabase.from.mockReturnValue(
      buildQueryMock({ data: [{ id: 'w1', day_number: 3, workout_type: 'Pull A', notes: null, completed_at: '2024-01-01T10:00:00Z' }] })
    )
    renderComponent()
    // currentDay = (3 % 9) + 1 = 4 (VO2). The "Up Next" badge should be on Day 4.
    await waitFor(() => expect(screen.getByText('Up Next')).toBeInTheDocument())
    expect(screen.getByText('Up Next').closest('button')).toHaveTextContent('VO2')
  })

  // --- REST_DAY must NOT advance the cycle ---
  // This is the key invariant: REST_DAY records are injected into the calendar
  // without consuming a scheduled workout slot. The cycle position query must
  // filter them out so the same workout day remains "Up Next" after a rest.

  it('excludes REST_DAY records from the cycle position query', async () => {
    // CycleView should issue a .neq('notes', 'REST_DAY') filter when querying
    // for the last workout. This test verifies the query is constructed correctly.
    renderComponent()
    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('workouts'))

    const neqCalls = supabase.from.mock.results.flatMap(r => r.value?.neq?.mock?.calls ?? [])
    expect(neqCalls.some(call => call[0] === 'notes' && call[1] === 'REST_DAY')).toBe(true)
  })

  it('does not advance cycle when last workout is a REST_DAY', async () => {
    // The query will exclude REST_DAY, so we simulate the DB returning the last
    // real workout (day 2) even though a REST_DAY was logged after it.
    supabase.from.mockReturnValue(
      buildQueryMock({ data: [{ id: 'w1', day_number: 2, workout_type: 'Zone 2', notes: null, completed_at: '2024-01-01T09:00:00Z' }] })
    )
    renderComponent()
    // currentDay should be (2 % 9) + 1 = 3 (Pull A), not 4
    await waitFor(() => expect(screen.getByText('Up Next')).toBeInTheDocument())
    expect(screen.getByText('Up Next').closest('button')).toHaveTextContent('Pull A')
  })

  it('SKIPPED days DO advance the cycle (regression guard)', async () => {
    // Unlike REST_DAY, a SKIPPED day means the user explicitly moved on.
    // SKIPPED records should NOT be excluded from the cycle position query.
    supabase.from.mockReturnValue(
      buildQueryMock({ data: [{ id: 'w1', day_number: 3, workout_type: 'Pull A', notes: 'SKIPPED', completed_at: '2024-01-01T10:00:00Z' }] })
    )
    renderComponent()
    // currentDay = (3 % 9) + 1 = 4 (VO2)
    await waitFor(() => expect(screen.getByText('Up Next')).toBeInTheDocument())
    expect(screen.getByText('Up Next').closest('button')).toHaveTextContent('VO2')
  })
})
