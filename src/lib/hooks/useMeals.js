import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../../contexts/useAuth'

/**
 * useMeals — fetches all meals for the current user, ordered by consumed_at DESC.
 *
 * This hook centralizes the meals query that was previously duplicated in
 * MealView, MealHistory, and NutritionAnalyticsView. All three components
 * used the identical Supabase query:
 *
 *   supabase.from('meals').select('*').eq('user_id', user.id)
 *     .order('consumed_at', { ascending: false })
 *
 * Extracting it here means a change to query parameters (e.g., adding a
 * filter or changing the sort) only needs to happen in one place.
 *
 * Returns:
 *   meals    — array of meal rows from the DB (empty while loading or on error)
 *   setMeals — direct state setter; used in MealView for optimistic deletes
 *              so the row disappears immediately without a round-trip fetch
 *   loading  — true while the initial fetch or a refetch is in flight
 *   error    — error message string, or '' if no error
 *   refetch  — async function; call after a mutation (insert) to re-sync state
 */
export function useMeals() {
  const { user } = useAuth()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refetch = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('consumed_at', { ascending: false })

    if (error) {
      setError(error.message)
      setMeals([])
    } else {
      setMeals(data ?? [])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user?.id) return
    refetch()
  }, [user?.id, refetch])

  return { meals, setMeals, loading, error, refetch }
}
