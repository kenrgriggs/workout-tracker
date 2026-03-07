import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './components/LoginPage'
import CycleView from './components/CycleView'
import WorkoutView from './components/WorkoutView'
import HistoryView from './components/HistoryView'
import AccountView from './components/AccountView'
import ProgramView from './components/ProgramView'
import BottomNav from './components/BottomNav'

const MAX_WIDTH = 680

function AppShell() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('cycle')
  const [selectedDay, setSelectedDay] = useState(null)

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
            dayNumber={selectedDay}
            onBack={() => setSelectedDay(null)}
            onFinish={() => {
              setSelectedDay(null)
              setActiveTab('history')
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
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: '#0a0a0acc',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #191919',
        }}>
          <div style={{
            maxWidth: MAX_WIDTH,
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <p style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: 9,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#444',
                marginBottom: 1,
              }}>
                Training / PPL + VO2
              </p>
              <h1 style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 22,
                letterSpacing: '0.04em',
                color: '#f0f0f0',
                lineHeight: 1,
              }}>
                Workout Tracker
              </h1>
            </div>
          </div>
        </header>

        <main style={{ maxWidth: MAX_WIDTH, margin: '0 auto' }}>
          {activeTab === 'cycle' && (
            <CycleView onSelectDay={(day) => setSelectedDay(day)} />
          )}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'program' && <ProgramView />}
          {activeTab === 'account' && <AccountView />}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
