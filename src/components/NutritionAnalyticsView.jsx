import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/useAuth'
import { SectionLabel } from './ui'
import { downloadCSV } from '../lib/export'

export default function NutritionAnalyticsView() {
  const { user } = useAuth()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function fetchMeals() {
      setLoading(true)
      const { data } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('consumed_at', { ascending: false })
      setMeals(data ?? [])
      setLoading(false)
    }
    if (user?.id) fetchMeals()
  }, [user?.id])

  // ── Derived stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (meals.length === 0) return null

    // Distinct calendar days that have at least one meal
    const daySet = new Set(
      meals.map(m => new Date(m.consumed_at).toLocaleDateString())
    )
    const daysTracked = daySet.size

    // Per-day totals → averages
    const byDay = {}
    meals.forEach(m => {
      const key = new Date(m.consumed_at).toLocaleDateString()
      if (!byDay[key]) byDay[key] = { calories: 0, protein: 0, carbs: 0, fats: 0 }
      byDay[key].calories += m.calories ?? 0
      byDay[key].protein  += m.protein  ?? 0
      byDay[key].carbs    += m.carbs    ?? 0
      byDay[key].fats     += m.fats     ?? 0
    })
    const dayValues = Object.values(byDay)
    const avg = key => Math.round(dayValues.reduce((s, d) => s + d[key], 0) / daysTracked)

    // Top meals by frequency + avg calories per entry
    const mealStats = {}
    meals.forEach(m => {
      const key = m.name.toLowerCase()
      if (!mealStats[key]) mealStats[key] = { name: m.name, count: 0, totalCal: 0, totalProtein: 0 }
      mealStats[key].count++
      mealStats[key].totalCal     += m.calories ?? 0
      mealStats[key].totalProtein += m.protein  ?? 0
    })
    const topMeals = Object.values(mealStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(m => ({
        name:       m.name,
        count:      m.count,
        avgCal:     Math.round(m.totalCal / m.count),
        avgProtein: Math.round(m.totalProtein / m.count),
      }))

    return {
      totalMeals: meals.length,
      daysTracked,
      avgCalories: avg('calories'),
      avgProtein:  avg('protein'),
      avgCarbs:    avg('carbs'),
      avgFats:     avg('fats'),
      byDay,
      topMeals,
    }
  }, [meals])

  // Last 7 calendar days for the bar chart
  const last7 = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString()
      days.push({
        key,
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        date: d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        calories: stats?.byDay?.[key]?.calories ?? 0,
        protein:  stats?.byDay?.[key]?.protein  ?? 0,
      })
    }
    return days
  }, [stats])

  const maxDayCalories = useMemo(
    () => Math.max(...last7.map(d => d.calories), 1),
    [last7]
  )

  async function exportNutrition() {
    setExporting(true)
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('consumed_at', { ascending: false })
    const headers = ['Date', 'Name', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fats (g)', 'Notes']
    const rows = (data ?? []).map(m => [
      new Date(m.consumed_at).toLocaleString(),
      m.name,
      m.calories ?? '',
      m.protein  ?? '',
      m.carbs    ?? '',
      m.fats     ?? '',
      m.notes    ?? '',
    ])
    downloadCSV('nutrition.csv', headers, rows)
    setExporting(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <p className="page-subtitle">Nutrition</p>
          <h1 className="page-title">Analytics</h1>
        </div>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', textAlign: 'center', padding: '28px 0' }}>
          Loading…
        </p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="page">
        <div className="page-header">
          <p className="page-subtitle">Nutrition</p>
          <h1 className="page-title">Analytics</h1>
        </div>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', textAlign: 'center', padding: '40px 0' }}>
          Log some meals to see your analytics.
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="page-subtitle">Nutrition</p>
        <h1 className="page-title">Analytics</h1>
      </div>

      {/* Overview */}
      <SectionLabel>Overview</SectionLabel>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Days Tracked</div>
          <p className="stat-value">{stats.daysTracked}</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Meals Logged</div>
          <p className="stat-value">{stats.totalMeals}</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Cal / Day</div>
          <p className="stat-value">{stats.avgCalories}</p>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Protein</div>
          <p className="stat-value">{stats.avgProtein}<span style={{ fontSize: 16, color: '#6b6b6b' }}>g</span></p>
        </div>
      </div>

      {/* Macro averages */}
      <SectionLabel>Daily Averages</SectionLabel>
      <div className="card" style={{ marginBottom: 28 }}>
        {[
          { label: 'Protein',      value: stats.avgProtein, color: '#4af0ff', max: 250 },
          { label: 'Carbohydrates',value: stats.avgCarbs,   color: '#e8ff4a', max: 400 },
          { label: 'Fats',         value: stats.avgFats,    color: '#ff6b35', max: 150 },
        ].map(({ label, value, color, max }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </span>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#f0f0f0' }}>
                {value}g
              </span>
            </div>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((value / max) * 100, 100)}%`,
                background: color,
                borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#444', marginTop: 4 }}>
          Bars scaled to general reference maximums.
        </p>
      </div>

      {/* Last 7 days bar chart */}
      <SectionLabel>Last 7 Days</SectionLabel>
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
          {last7.map(day => {
            const pct = maxDayCalories > 0 ? (day.calories / maxDayCalories) * 100 : 0
            const hasData = day.calories > 0
            return (
              <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                {hasData && (
                  <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#6b6b6b', whiteSpace: 'nowrap' }}>
                    {day.calories >= 1000 ? `${(day.calories / 1000).toFixed(1)}k` : day.calories}
                  </span>
                )}
                <div style={{
                  width: '100%',
                  height: `${Math.max(pct, hasData ? 4 : 0)}%`,
                  background: hasData ? '#4af0ff' : '#1a1a1a',
                  borderRadius: '3px 3px 0 0',
                  opacity: hasData ? 1 : 0.3,
                  minHeight: hasData ? 4 : 0,
                }} />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {last7.map(day => (
            <div key={day.key} style={{ flex: 1, textAlign: 'center' }}>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#555', display: 'block' }}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top meals */}
      {stats.topMeals.length > 0 && (
        <>
          <SectionLabel>Most Logged</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {stats.topMeals.map((meal, i) => (
              <div key={i} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, margin: 0, lineHeight: 1.1 }}>
                      {meal.name}
                    </p>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', marginTop: 4 }}>
                      logged {meal.count}×
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 14, margin: 0, color: '#4af0ff' }}>
                      {meal.avgCal} kcal
                    </p>
                    {meal.avgProtein > 0 && (
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>
                        {meal.avgProtein}g protein
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          onClick={exportNutrition}
          disabled={exporting}
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
          {exporting ? '...' : 'Export Nutrition CSV'}
        </button>
      </div>
    </div>
  )
}
