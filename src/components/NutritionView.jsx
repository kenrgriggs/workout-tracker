import MealView from './MealView'
import MealHistory from './MealHistory'
import { SectionLabel } from './ui'

export default function NutritionView({ activeTab }) {
  return (
    <div className="page">
      <div className="page-header">
        <p className="page-subtitle">Nutrition</p>
        <h1 className="page-title">Meal Tracker</h1>
      </div>

      {activeTab === 'log' && <MealView />}
      {activeTab === 'history' && <MealHistory />}

      {activeTab === 'program' && (
        <div style={{ paddingBottom: 100 }}>
          <SectionLabel>Nutrition Program</SectionLabel>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', padding: '18px 0' }}>
            Coming soon: structured meal plans, macro targets, and weekly templates.
          </p>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div style={{ paddingBottom: 100 }}>
          <SectionLabel>Analytics</SectionLabel>
          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b', padding: '18px 0' }}>
            Coming soon: nutrition trends, calorie graphs, and macro breakdowns.
          </p>
        </div>
      )}
    </div>
  )
}
