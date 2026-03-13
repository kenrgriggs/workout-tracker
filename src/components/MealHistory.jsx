import { useMemo, useState } from 'react'
import { downloadCSV } from '../lib/export'
import { useMeals } from '../lib/hooks/useMeals'

export default function MealHistory() {
  const { meals, loading } = useMeals()
  const [exporting, setExporting] = useState(false)

  // Export uses the already-loaded `meals` array from useMeals rather than
  // re-querying Supabase, since the hook fetches all meals on mount in the
  // same order (consumed_at DESC) that the export needs.
  async function exportNutrition() {
    setExporting(true)
    const headers = ['Date', 'Name', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fats (g)', 'Notes']
    const rows = meals.map(m => [
      new Date(m.consumed_at).toLocaleString(),
      m.name,
      m.calories ?? '',
      m.protein ?? '',
      m.carbs ?? '',
      m.fats ?? '',
      m.notes ?? '',
    ])
    downloadCSV('nutrition.csv', headers, rows)
    setExporting(false)
  }

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => {
        acc.calories += meal.calories ?? 0
        acc.protein += meal.protein ?? 0
        acc.carbs += meal.carbs ?? 0
        acc.fats += meal.fats ?? 0
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )
  }, [meals])

  const macroPct = useMemo(() => {
    const { calories, protein, carbs, fats } = totals
    const pct = (g, calPerG) =>
      calories > 0 && g != null ? Math.round((g * calPerG / calories) * 100) : null
    return {
      protein: pct(protein, 4),
      carbs:   pct(carbs, 4),
      fats:    pct(fats, 9),
    }
  }, [totals])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Meal History</h1>
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Calories</div>
          <p className="stat-value">{totals.calories}</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Protein</div>
          <p className="stat-value">{totals.protein}</p>
          {macroPct.protein !== null && <p className="stat-pct">{macroPct.protein}%</p>}
        </div>
        <div className="stat-card">
          <div className="stat-label">Carbs</div>
          <p className="stat-value">{totals.carbs}</p>
          {macroPct.carbs !== null && <p className="stat-pct">{macroPct.carbs}%</p>}
        </div>
        <div className="stat-card">
          <div className="stat-label">Fats</div>
          <p className="stat-value">{totals.fats}</p>
          {macroPct.fats !== null && <p className="stat-pct">{macroPct.fats}%</p>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 24, margin: 0 }}>Recent meals</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#6b6b6b', margin: 0 }}>
            Updated {loading ? '...' : `${meals.length} entries`}
          </p>
          <button
            onClick={exportNutrition}
            disabled={exporting || meals.length === 0}
            style={{
              background: 'none',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              color: '#6b6b6b',
              fontFamily: '"DM Mono", monospace',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '5px 12px',
              opacity: exporting ? 0.5 : 1,
            }}
          >
            {exporting ? '...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#6b6b6b', textAlign: 'center', padding: '28px 0' }}>
          Loading…
        </p>
      ) : meals.length === 0 ? (
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#6b6b6b', textAlign: 'center', padding: '28px 0' }}>
          No meals yet. Add a meal in the Log tab.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {meals.map(meal => (
            <div key={meal.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, margin: 0, lineHeight: 1.1 }}>{meal.name}</p>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#6b6b6b', marginTop: 4 }}>
                    {new Date(meal.consumed_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {meal.notes && (
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#888', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                      {meal.notes}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, margin: 0 }}>{meal.calories ?? 0}</p>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 10, color: '#6b6b6b', marginTop: 4 }}>kcal</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
