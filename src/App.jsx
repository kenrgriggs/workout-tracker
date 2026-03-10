import { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { useAuth } from './contexts/useAuth'
import LoginPage from './components/LoginPage'
import CycleView from './components/CycleView'
import NutritionView from './components/NutritionView'
import WorkoutView from './components/WorkoutView'
import HistoryView from './components/HistoryView'
import AccountView from './components/AccountView'
import ProgramView from './components/ProgramView'
import AnalyticsView from './components/AnalyticsView'
import BottomNav from './components/BottomNav'

const MAX_WIDTH = 680

function AppShell() {
  const { user, loading } = useAuth()
  const [activeSection, setActiveSection] = useState('workout')
  const [workoutTab, setWorkoutTab] = useState('cycle')
  const [nutritionTab, setNutritionTab] = useState('log')
  const [selectedDay, setSelectedDay] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const sectionMeta = {
    workout: { title: 'Workout Tracker', subtitle: 'Training / PPL + VO2' },
    nutrition: { title: 'Nutrition Tracker', subtitle: 'Track calories & macros' },
    account: { title: 'Account', subtitle: 'Profile & settings' },
  }
  const { title, subtitle } = sectionMeta[activeSection] ?? sectionMeta.workout

  const setSection = (section) => {
    setActiveSection(section)
    setMenuOpen(false)
  }

  const navItems = [
    { id: 'workout', label: 'Workout', description: '9-day cycle' },
    { id: 'nutrition', label: 'Nutrition', description: 'Food + calories' },
    { id: 'account', label: 'Account', description: 'Profile & settings' },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#6b6b6b' }}>Loading...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (selectedDay !== null) {
    return (
      <div style={{ position: 'relative', backgroundColor: '#0a0a0a', minHeight: '100dvh' }}>
        <div className="noise-overlay" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          <WorkoutView
            key={selectedDay}
            dayNumber={selectedDay}
            onBack={() => setSelectedDay(null)}
            onFinish={() => {
              setSelectedDay(null)
              setWorkoutTab('history')
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', backgroundColor: '#0a0a0a', minHeight: '100dvh' }}>
      <div className="noise-overlay" />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header — full width bg, inner content constrained */}
        <header className="app-header">
          <div className="app-header-inner">
            <div style={{ flex: 1 }}>
              <p className="app-header-subtitle">{subtitle}</p>
              <h1 className="app-header-title">{title}</h1>
            </div>

            <button
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#f0f0f0',
                fontSize: 22,
                cursor: 'pointer',
                padding: 8,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Open navigation"
            >
              ☰
            </button>
          </div>
        </header>

        <div
          className={`app-menu-backdrop ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className={`app-menu ${menuOpen ? 'open' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="app-menu-header">
              <p className="app-menu-title">Navigation</p>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b6b6b',
                  fontSize: 22,
                  cursor: 'pointer',
                }}
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`app-menu-item ${activeSection === item.id ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="app-menu-item-title">{item.label}</span>
                    <span className="app-menu-item-meta">{item.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <main style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          {activeSection === 'workout' && (
            <>
              {selectedDay !== null ? (
                <WorkoutView
                  key={selectedDay}
                  dayNumber={selectedDay}
                  onBack={() => setSelectedDay(null)}
                  onFinish={() => {
                    setSelectedDay(null)
                    setWorkoutTab('history')
                  }}
                />
              ) : (
                <>
                  {workoutTab === 'cycle' && (
                    <CycleView onSelectDay={(day) => setSelectedDay(day)} />
                  )}
                  {workoutTab === 'history' && <HistoryView />}
                  {workoutTab === 'program' && <ProgramView />}
                  {workoutTab === 'analytics' && <AnalyticsView />}
                </>
              )}
            </>
          )}

          {activeSection === 'nutrition' && (
            <NutritionView activeTab={nutritionTab} />
          )}

          {activeSection === 'account' && <AccountView />}
        </main>

        {activeSection === 'workout' && (
          <BottomNav
            tabs={[
              { id: 'cycle', label: 'Cycle', icon: '◈' },
              { id: 'history', label: 'History', icon: '▤' },
              { id: 'program', label: 'Program', icon: '▦' },
              { id: 'analytics', label: 'Analytics', icon: '▥' },
            ]}
            activeTab={workoutTab}
            onTabChange={setWorkoutTab}
          />
        )}

        {activeSection === 'nutrition' && (
          <BottomNav
            tabs={[
              { id: 'log', label: 'Log', icon: '🧾' },
              { id: 'history', label: 'History', icon: '▤' },
              { id: 'program', label: 'Program', icon: '▦' },
              { id: 'analytics', label: 'Analytics', icon: '▥' },
            ]}
            activeTab={nutritionTab}
            onTabChange={setNutritionTab}
          />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppShell />
      </SettingsProvider>
    </AuthProvider>
  )
}
