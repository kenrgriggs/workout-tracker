import MealView from './MealView'
import MealHistory from './MealHistory'
import NutritionAnalyticsView from './NutritionAnalyticsView'

export default function NutritionView({ activeTab }) {
  if (activeTab === 'log') return <MealView />
  if (activeTab === 'history') return <MealHistory />
  if (activeTab === 'analytics') return <NutritionAnalyticsView />

  const tabMeta = {
    program: { title: 'Nutrition Program', body: 'Coming soon: structured meal plans, macro targets, and weekly templates.' },
  }
  const meta = tabMeta[activeTab]

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{meta?.title ?? ''}</h1>
      </div>
      <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#6b6b6b' }}>
        {meta?.body}
      </p>
    </div>
  )
}
