import { useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/useAuth'
import { SectionLabel } from './ui'
import { useMeals } from '../lib/hooks/useMeals'

export default function MealView() {
  const { user } = useAuth()
  const { meals, setMeals, loading, error: fetchError, refetch: fetchMeals } = useMeals()
  const [saving, setSaving] = useState(false)
  // Two separate error slots because they have different lifecycles:
  // fetchError (from the hook) persists until the next fetch; submitError
  // is cleared at the start of each submit attempt.
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    notes: '',
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const blurTimeout = useRef(null)

  const error = fetchError || submitError

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

  // Caloric percentages for each macro.
  // Protein and carbs yield 4 cal/g; fats yield 9 cal/g.
  // Returns null when calories are 0 to avoid dividing by zero.
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

  // Deduplicated meal suggestions — most recent occurrence per unique name.
  // `meals` is ordered newest-first, so the first occurrence of each name is
  // the most recently logged entry. Selecting a suggestion pre-fills the macro
  // values from that entry, saving re-entry for regularly eaten meals.
  const mealSuggestions = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const meal of meals) {
      const key = meal.name.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        result.push(meal)
      }
    }
    return result
  }, [meals])

  const filteredSuggestions = useMemo(() => {
    if (!form.name.trim()) return []
    const query = form.name.toLowerCase()
    return mealSuggestions
      .filter(m => m.name.toLowerCase().includes(query))
      .slice(0, 7)
  }, [form.name, mealSuggestions])

  function selectSuggestion(meal) {
    setForm({
      name: meal.name,
      calories: meal.calories != null ? String(meal.calories) : '',
      protein: meal.protein != null ? String(meal.protein) : '',
      carbs: meal.carbs != null ? String(meal.carbs) : '',
      fats: meal.fats != null ? String(meal.fats) : '',
      notes: meal.notes ?? '',
    })
    setShowSuggestions(false)
  }

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleAddMeal() {
    setSubmitError('')
    if (!form.name.trim()) return

    setSaving(true)
    const { error } = await supabase.from('meals').insert({
      user_id: user.id,
      name: form.name.trim(),
      calories: form.calories ? parseInt(form.calories, 10) : 0,
      protein: form.protein ? parseInt(form.protein, 10) : null,
      carbs: form.carbs ? parseInt(form.carbs, 10) : null,
      fats: form.fats ? parseInt(form.fats, 10) : null,
      notes: form.notes.trim() || null,
    })

    if (error) {
      setSubmitError(error.message)
    } else {
      setForm({ name: '', calories: '', protein: '', carbs: '', fats: '', notes: '' })
      await fetchMeals()
    }

    setSaving(false)
  }

  async function handleDeleteMeal(id) {
    setSaving(true)
    await supabase.from('meals').delete().eq('id', id)
    setMeals(prev => prev.filter(meal => meal.id !== id))
    setSaving(false)
  }

  const showDropdown = showSuggestions && filteredSuggestions.length > 0

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Nutrition Log</h1>
        {error && (
          <div className="alert" style={{ marginTop: 12 }}>
            {error}
            <small>
              Make sure you've run the database migration in Supabase (see README).
            </small>
          </div>
        )}
      </div>

      <SectionLabel>Daily totals</SectionLabel>
      <div className="stats-grid">
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

      <SectionLabel>Add meal</SectionLabel>
      <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
        {/* Name field with autocomplete */}
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
            onFocus={() => {
              // Cancel any pending close from a previous blur so the dropdown
              // stays open when focus returns to the input.
              clearTimeout(blurTimeout.current)
              setShowSuggestions(true)
            }}
            onBlur={() => {
              // Delay closing so a click on a suggestion item fires before the
              // dropdown disappears. Without the delay, onBlur would close the
              // dropdown before onMouseDown on the suggestion could register.
              blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150)
            }}
            placeholder="Meal / food name"
            style={{ borderRadius: showDropdown ? '12px 12px 0 0' : undefined }}
          />
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              background: '#111',
              border: '1px solid #2a2a2a',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {filteredSuggestions.map((meal, i) => (
                <button
                  key={meal.id}
                  onMouseDown={() => selectSuggestion(meal)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    borderBottom: i < filteredSuggestions.length - 1 ? '1px solid #1e1e1e' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, color: '#f0f0f0' }}>
                    {meal.name}
                  </span>
                  <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#555', flexShrink: 0 }}>
                    {meal.calories != null ? `${meal.calories} kcal` : ''}
                    {meal.protein != null ? ` · ${meal.protein}g protein` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
          <input
            className="input"
            type="number"
            value={form.calories}
            onChange={(e) => updateForm('calories', e.target.value)}
            placeholder="Calories"
          />
          <input
            className="input"
            type="number"
            value={form.protein}
            onChange={(e) => updateForm('protein', e.target.value)}
            placeholder="Protein"
          />
          <input
            className="input"
            type="number"
            value={form.carbs}
            onChange={(e) => updateForm('carbs', e.target.value)}
            placeholder="Carbs"
          />
          <input
            className="input"
            type="number"
            value={form.fats}
            onChange={(e) => updateForm('fats', e.target.value)}
            placeholder="Fats"
          />
        </div>

        <textarea
          className="input"
          value={form.notes}
          onChange={(e) => updateForm('notes', e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          style={{ resize: 'vertical' }}
        />

        <button
          className="btn btn-primary"
          onClick={handleAddMeal}
          disabled={saving || !form.name.trim()}
        >
          {saving ? 'Saving…' : 'Add meal'}
        </button>
      </div>

      <SectionLabel>Recent meals</SectionLabel>
      {loading ? (
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#6b6b6b', textAlign: 'center', padding: '28px 0' }}>
          Loading…
        </p>
      ) : meals.length === 0 ? (
        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#6b6b6b', textAlign: 'center', padding: '28px 0' }}>
          No meals yet. Add your first one above.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {meals.map(meal => (
            <div key={meal.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, margin: 0, lineHeight: 1.1 }}>{meal.name}</p>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#6b6b6b', marginTop: 4 }}>
                    {new Date(meal.consumed_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {meal.notes && (
                    <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#888', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                      {meal.notes}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 20, margin: 0 }}>{meal.calories ?? 0}</p>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>kcal</p>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    disabled={saving}
                    className="subtle-btn"
                    style={{ marginTop: 10 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
