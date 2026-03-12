import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import NutritionAnalyticsView from './NutritionAnalyticsView'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'

// Spans 2 distinct calendar days; Oatmeal appears twice
const FAKE_MEALS = [
  { id: '1', name: 'Oatmeal',      calories: 350, protein: 12, carbs: 55, fats: 6,  consumed_at: '2024-01-15T08:00:00Z', notes: null },
  { id: '2', name: 'Chicken Rice', calories: 520, protein: 45, carbs: 65, fats: 8,  consumed_at: '2024-01-15T12:00:00Z', notes: null },
  { id: '3', name: 'Oatmeal',      calories: 350, protein: 12, carbs: 55, fats: 6,  consumed_at: '2024-01-16T08:00:00Z', notes: null },
]

function renderComponent() {
  return render(<AppWrapper><NutritionAnalyticsView /></AppWrapper>)
}

beforeEach(() => {
  supabase.from.mockReturnValue(buildQueryMock({ data: [], error: null }))
})

describe('NutritionAnalyticsView — empty state', () => {
  it('prompts the user to log meals when there are none', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/log some meals/i)).toBeInTheDocument()
    )
  })
})

describe('NutritionAnalyticsView — overview stats', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_MEALS }))
  })

  it('shows the number of distinct days tracked', async () => {
    renderComponent()
    // FAKE_MEALS has entries on 2 different days
    await waitFor(() => {
      const daysStat = screen.getByText('2')
      expect(daysStat).toBeInTheDocument()
    })
  })

  it('shows total meals logged', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('shows the average calories per day', async () => {
    renderComponent()
    // Day 1: 350+520=870, Day 2: 350 → avg = (870+350)/2 = 610
    await waitFor(() =>
      expect(screen.getByText('610')).toBeInTheDocument()
    )
  })
})

describe('NutritionAnalyticsView — most logged meals', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_MEALS }))
  })

  it('shows "Most Logged" section heading', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/most logged/i)).toBeInTheDocument()
    )
  })

  it('shows the meal logged most frequently', async () => {
    renderComponent()
    // Oatmeal appears twice, Chicken Rice once → Oatmeal is first
    await waitFor(() => {
      const matches = screen.getAllByText('Oatmeal')
      expect(matches.length).toBeGreaterThan(0)
    })
  })

  it('shows the frequency count for the most logged meal', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/logged 2×/i)).toBeInTheDocument()
    )
  })
})

describe('NutritionAnalyticsView — sections', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_MEALS }))
  })

  it('renders the Daily Averages section', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/daily averages/i)).toBeInTheDocument()
    )
  })

  it('renders the Last 7 Days section', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/last 7 days/i)).toBeInTheDocument()
    )
  })

  it('renders the export button', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/export nutrition csv/i)).toBeInTheDocument()
    )
  })
})
