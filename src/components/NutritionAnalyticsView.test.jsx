import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import NutritionAnalyticsView from './NutritionAnalyticsView'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

// Same mocking approach as MealHistory — replace Supabase with a controllable fake.
vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'

// Three meal rows chosen to produce specific, assertable computed values:
//   - Oatmeal appears on Jan 15 AND Jan 16 → 2 distinct days, logged 2×
//   - Chicken Rice appears once on Jan 15 → ranked below Oatmeal
//   - Jan 15 totals: 350+520 = 870 cal. Jan 16 totals: 350 cal.
//   - Average calories per day: (870+350) / 2 = 610
// Every number in these tests can be traced back to this fixture.
const FAKE_MEALS = [
  { id: '1', name: 'Oatmeal',      calories: 350, protein: 12, carbs: 55, fats: 6,  consumed_at: '2024-01-15T08:00:00Z', notes: null },
  { id: '2', name: 'Chicken Rice', calories: 520, protein: 45, carbs: 65, fats: 8,  consumed_at: '2024-01-15T12:00:00Z', notes: null },
  { id: '3', name: 'Oatmeal',      calories: 350, protein: 12, carbs: 55, fats: 6,  consumed_at: '2024-01-16T08:00:00Z', notes: null },
]

function renderComponent() {
  return render(<AppWrapper><NutritionAnalyticsView /></AppWrapper>)
}

// Default: empty data. Each describe block that needs data overrides this in its own beforeEach.
beforeEach(() => {
  supabase.from.mockReturnValue(buildQueryMock({ data: [], error: null }))
})

describe('NutritionAnalyticsView — empty state', () => {
  // With no meals logged, the stats block would show all zeros and the charts
  // would be meaningless. The component guards against this with an early return
  // that renders a prompt instead. This verifies that guard works.
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

  // "Days Tracked" is computed by counting distinct calendar dates in consumed_at.
  // FAKE_MEALS has entries on Jan 15 and Jan 16 → 2.
  // If the grouping logic groups by ISO string instead of local date, all three
  // rows might be distinct (3) or might collapse differently.
  it('shows the number of distinct days tracked', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  // "Meals Logged" is a simple count of all rows — 3 in FAKE_MEALS.
  // Distinct from days tracked: three meals on two days.
  it('shows total meals logged', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  // Average calories = total calories across all days / number of distinct days.
  // Day 1: 870, Day 2: 350 → (870+350)/2 = 610.
  // Tests the per-day grouping + averaging logic in the useMemo stats block.
  it('shows the average calories per day', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText('610')).toBeInTheDocument()
    )
  })
})

describe('NutritionAnalyticsView — most logged meals', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_MEALS }))
  })

  // Verifies the section heading exists — a basic smoke test that the
  // Most Logged section renders at all when there is data.
  it('shows "Most Logged" section heading', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/most logged/i)).toBeInTheDocument()
    )
  })

  // Verifies ranking — not just presence. Grabs all elements whose text
  // exactly matches either meal name, then asserts the first is Oatmeal.
  // If the sort were reversed or not applied, Chicken Rice would appear first.
  it('shows Oatmeal as the first card in the Most Logged list', async () => {
    renderComponent()
    await waitFor(() => screen.getByText(/most logged/i))
    const cards = screen.getAllByText(/^(Oatmeal|Chicken Rice)$/i)
    expect(cards[0]).toHaveTextContent('Oatmeal')
  })

  // Verifies the full ranking order, not just the top entry.
  // Chicken Rice (logged once) must appear after Oatmeal (logged twice).
  it('shows Chicken Rice ranked below Oatmeal', async () => {
    renderComponent()
    await waitFor(() => screen.getByText(/most logged/i))
    const cards = screen.getAllByText(/^(Oatmeal|Chicken Rice)$/i)
    expect(cards[1]).toHaveTextContent('Chicken Rice')
  })

  // Verifies the "logged 2×" count is scoped to the correct card, not just
  // present somewhere on the page. Uses .closest('.card') to walk up the DOM
  // from the Oatmeal heading to its containing card, then asserts the card
  // contains the count. If the count were on the wrong meal, this fails.
  it('shows the frequency count next to the most logged meal', async () => {
    renderComponent()
    await waitFor(() => {
      const oatmeal = screen.getAllByText('Oatmeal')[0]
      const card = oatmeal.closest('.card')
      expect(card).toHaveTextContent('logged 2×')
    })
  })
})

describe('NutritionAnalyticsView — sections', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_MEALS }))
  })

  // Smoke tests: verify the three main sections render when data is present.
  // These don't test the content of each section — they guard against a section
  // being accidentally removed or conditionally hidden when it shouldn't be.

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

  // The export button is always present when data exists. If it disappears,
  // users lose the ability to export their nutrition data without any error.
  it('renders the export button', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/export nutrition csv/i)).toBeInTheDocument()
    )
  })
})
