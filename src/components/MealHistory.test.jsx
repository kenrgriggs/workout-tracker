import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MealHistory from './MealHistory'
import { AppWrapper } from '../test/mocks/contexts'
import { buildQueryMock } from '../test/mocks/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'

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
  return render(<AppWrapper><MealHistory /></AppWrapper>)
}

beforeEach(() => {
  supabase.from.mockReturnValue(buildQueryMock({ data: [], error: null }))
})

describe('MealHistory — loading', () => {
  it('shows a loading indicator before data arrives', () => {
    // Never resolves — keeps the component in loading state
    supabase.from.mockReturnValue({
      ...buildQueryMock(),
      then: () => new Promise(() => {}),
    })
    renderComponent()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

describe('MealHistory — empty state', () => {
  it('shows an empty state message when there are no meals', async () => {
    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/no meals yet/i)).toBeInTheDocument()
    )
  })
})

describe('MealHistory — with data', () => {
  beforeEach(() => {
    supabase.from.mockReturnValue(buildQueryMock({ data: FAKE_MEALS }))
  })

  it('renders each meal name', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('Oatmeal'))
    expect(screen.getByText('Chicken Rice')).toBeInTheDocument()
  })

  it('renders calorie values for each meal', async () => {
    renderComponent()
    await waitFor(() => screen.getByText('350'))
    expect(screen.getByText('520')).toBeInTheDocument()
  })

  it('shows the total calorie count across all meals', async () => {
    renderComponent()
    // Stats grid totals: 350 + 520 = 870
    await waitFor(() => expect(screen.getByText('870')).toBeInTheDocument())
  })

  it('shows the total protein count across all meals', async () => {
    renderComponent()
    // 12 + 45 = 57
    await waitFor(() => expect(screen.getByText('57')).toBeInTheDocument())
  })

  it('renders meal notes when present', async () => {
    renderComponent()
    await waitFor(() => expect(screen.getByText('post-workout')).toBeInTheDocument())
  })
})
