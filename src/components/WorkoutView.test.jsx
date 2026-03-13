import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import WorkoutView from './WorkoutView'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

// Supabase is replaced entirely with a mock. The real client makes HTTP
// requests to a live database — tests must never do that.
vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

// Import after vi.mock so we get the mocked version.
import { supabase } from '../lib/supabase'

// Day 3 is Pull A — a regular exercise day with set logging.
// Used throughout to test the full workout view (not rest/notesOnly branches).
const DAY_NUMBER = 3

function renderComponent(props = {}) {
  return render(
    <AppWrapper>
      <WorkoutView
        dayNumber={DAY_NUMBER}
        onBack={vi.fn()}
        onFinish={vi.fn()}
        {...props}
      />
    </AppWrapper>
  )
}

// Default: no previous workout, all queries succeed with empty data.
// Two calls happen on mount:
//   1. fetchLastSession — supabase.from('workouts').select('id')...single() → null → early return
//   2. fetchConsecutiveRestDays — supabase.from('workouts').select('notes')...limit(8) → []
// Both are satisfied by buildQueryMock({ data: [] }):
//   - single() returns data[0] ?? null = null
//   - then() returns { data: [], error: null }
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  supabase.from.mockReturnValue(buildQueryMock({ data: [], error: null }))
})

// --- Quick action buttons at the top ---

describe('WorkoutView — quick actions at top', () => {
  it('renders a Skip Day button visible before the exercise list', () => {
    renderComponent()
    // getAllByRole because the button also appears at the bottom
    const skipButtons = screen.getAllByRole('button', { name: /skip day/i })
    expect(skipButtons.length).toBeGreaterThan(0)
  })

  it('renders a Take Rest Day button', () => {
    renderComponent()
    const restButtons = screen.getAllByRole('button', { name: /take rest day/i })
    expect(restButtons.length).toBeGreaterThan(0)
  })

  it('renders Finish Workout button', () => {
    renderComponent()
    const finishButtons = screen.getAllByRole('button', { name: /finish workout/i })
    expect(finishButtons.length).toBeGreaterThan(0)
  })
})

// --- Take Rest Day action ---

describe('WorkoutView — Take Rest Day', () => {
  it('inserts a workout row with notes "REST_DAY"', async () => {
    const onFinish = vi.fn()
    renderComponent({ onFinish })

    fireEvent.click(screen.getAllByRole('button', { name: /take rest day/i })[0])

    await waitFor(() => expect(onFinish).toHaveBeenCalled())

    // Walk every supabase.from() call and find any .insert() invocation.
    // This is resilient to the order of supabase calls (fetchLastSession runs first).
    const insertCalls = supabase.from.mock.results.flatMap(
      r => r.value?.insert?.mock?.calls ?? []
    )
    expect(insertCalls.some(call => call[0]?.notes === 'REST_DAY')).toBe(true)
  })

  it('inserts the current day_number so the REST_DAY is traceable in history', async () => {
    // The REST_DAY record stores the scheduled day so history shows which workout
    // was deferred. CycleView excludes REST_DAY records from its position query,
    // so storing the scheduled day_number here does NOT advance the cycle.
    const onFinish = vi.fn()
    renderComponent({ onFinish, dayNumber: 3 })

    fireEvent.click(screen.getAllByRole('button', { name: /take rest day/i })[0])

    await waitFor(() => expect(onFinish).toHaveBeenCalled())

    const insertCalls = supabase.from.mock.results.flatMap(
      r => r.value?.insert?.mock?.calls ?? []
    )
    const restInsert = insertCalls.find(call => call[0]?.notes === 'REST_DAY')
    expect(restInsert[0]).toMatchObject({ day_number: 3, notes: 'REST_DAY' })
  })

  it('calls onFinish after logging a rest day', async () => {
    const onFinish = vi.fn()
    renderComponent({ onFinish })

    fireEvent.click(screen.getAllByRole('button', { name: /take rest day/i })[0])

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1))
  })

  // --- 7-day consecutive rest limit ---

  it('disables all Take Rest Day buttons after 7 consecutive rest days', async () => {
    // Sequence two supabase.from calls on mount:
    //   1. fetchLastSession workouts query (single() → null, no previous set data)
    //   2. fetchConsecutiveRestDays query (then → 7 REST_DAY records)
    // Using mockReturnValueOnce so each call gets its own configured result.
    supabase.from
      .mockReturnValueOnce(buildQueryMock({ data: [] }))  // fetchLastSession → null
      .mockReturnValueOnce(buildQueryMock({ data: Array(7).fill({ notes: 'REST_DAY' }) }))  // 7 consecutive

    renderComponent()

    await waitFor(() => {
      const restButtons = screen.getAllByRole('button', { name: /take rest day/i })
      restButtons.forEach(btn => expect(btn).toBeDisabled())
    })
  })

  it('keeps Take Rest Day enabled with fewer than 7 consecutive rest days', async () => {
    supabase.from
      .mockReturnValueOnce(buildQueryMock({ data: [] }))
      .mockReturnValueOnce(buildQueryMock({ data: Array(6).fill({ notes: 'REST_DAY' }) }))

    renderComponent()

    // Give async queries time to resolve before asserting enabled state
    await waitFor(() => {
      const restButtons = screen.getAllByRole('button', { name: /take rest day/i })
      // At least one button should not be disabled
      expect(restButtons.some(btn => !btn.disabled)).toBe(true)
    })
  })
})

// --- Skip Day (existing behavior must not regress) ---

describe('WorkoutView — Skip Day', () => {
  it('inserts a workout row with notes "SKIPPED"', async () => {
    const onFinish = vi.fn()
    renderComponent({ onFinish })

    fireEvent.click(screen.getAllByRole('button', { name: /skip day/i })[0])

    await waitFor(() => expect(onFinish).toHaveBeenCalled())

    const insertCalls = supabase.from.mock.results.flatMap(
      r => r.value?.insert?.mock?.calls ?? []
    )
    expect(insertCalls.some(call => call[0]?.notes === 'SKIPPED')).toBe(true)
  })
})
