import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MealView from './MealView'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

// Supabase is replaced entirely with a mock. The real client makes HTTP
// requests to a live database — tests must never do that.
vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'

// Two meals with deliberate, assertable numbers:
//   calories: 400 + 600 = 1000  (total we assert on)
//   protein:   30 +  50 =   80  (total we assert on)
//   notes: 'pre-workout' on one, null on the other (tests both paths)
const FAKE_MEALS = [
  {
    id: '1',
    name: 'Eggs and Toast',
    calories: 400,
    protein: 30,
    carbs: 40,
    fats: 12,
    consumed_at: '2024-01-15T07:00:00Z',
    notes: 'pre-workout',
  },
  {
    id: '2',
    name: 'Protein Shake',
    calories: 600,
    protein: 50,
    carbs: 80,
    fats: 10,
    consumed_at: '2024-01-15T10:00:00Z',
    notes: null,
  },
]

function renderComponent() {
  // AppWrapper provides AuthContext (fake logged-in user) and SettingsContext.
  return render(<AppWrapper><MealView /></AppWrapper>)
}

// Default: every test starts with an empty result unless overridden.
beforeEach(() => {
  supabase.from.mockReturnValue(buildQueryMock({ data: [], error: null }))
})

describe('MealView — loading', () => {
  // Keeps the fetch Promise permanently pending so the loading branch stays visible.
  it('shows a loading indicator before data arrives', () => {
    supabase.from.mockReturnValue({
      ...buildQueryMock(),
      then: () => new Promise(() => {}), // hangs forever
    })
    renderComponent()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

describe('MealView — empty state', () => {
  // Default beforeEach returns [] so no override needed.
  it('shows an empty state message when there are no meals', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/no meals yet/i)).toBeInTheDocument()
    )
  })
})

describe('MealView — with data', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_MEALS }))
  })

  // Verifies both meal names appear in the recent-meals list.
  it('renders each meal name', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('Eggs and Toast'))
    expect(screen.getByText('Protein Shake')).toBeInTheDocument()
  })

  // Verifies the per-meal calorie values appear on individual meal cards.
  it('renders calorie values for each meal', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('400'))
    expect(screen.getByText('600')).toBeInTheDocument()
  })

  // The daily-totals grid at the top sums all meals. 400 + 600 = 1000.
  it('shows the total calorie count in the daily totals', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('1000')).toBeInTheDocument())
  })

  // 30 + 50 = 80. Verifies the reduce runs over all macro columns.
  it('shows the total protein count in the daily totals', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('80')).toBeInTheDocument())
  })

  // notes is nullable. Verifies notes render when present; null on the other
  // meal verifies the component doesn't crash (no assertion needed — a crash
  // would fail the test itself).
  it('renders meal notes when present', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText('pre-workout')).toBeInTheDocument()
    )
  })
})

describe('MealView — error state', () => {
  // MealView shows an alert when the fetch returns an error.
  // MealHistory and NutritionAnalyticsView silently ignore errors;
  // MealView is the only component with visible error handling.
  it('shows an error message when the fetch fails', async () => {
    supabase.from.mockReturnValue(
      buildQueryMock({ data: null, error: { message: 'network error' } })
    )
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    )
  })
})

describe('MealView — form', () => {
  // Smoke test: the Add meal form renders on mount regardless of data state.
  it('renders the meal name input', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/meal \/ food name/i)).toBeInTheDocument()
    )
  })

  // The Add meal button is always present, initially disabled when name is empty.
  it('renders the Add meal button', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add meal/i })).toBeInTheDocument()
    )
  })
})
