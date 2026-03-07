import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import LoginPage from './components/LoginPage'
import CycleView from './components/CycleView'
import WorkoutView from './components/WorkoutView'
import HistoryView from './components/HistoryView'
import BottomNav from './components/BottomNav'

function AppShell() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('cycle')
  const [selectedDay, setSelectedDay] = useState(null)

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }}>
        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 12, color: '#555' }}>Loading...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (selectedDay !== null) {
    return (
      <div style={{ position: 'relative', backgroundColor: '#0a0a0a', minHeight: '100dvh' }}>
        <div className="noise-overlay" />
        <div style={{ position: 'relative', zIndex: 1 }}>
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
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: '#0a0a0acc',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #191919',
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
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: 'none',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              color: '#555',
              padding: '5px 12px',
              fontFamily: '"DM Mono", monospace',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </header>

        <main>
          {activeTab === 'cycle' && (
            <CycleView onSelectDay={(day) => setSelectedDay(day)} />
          )}
          {activeTab === 'history' && <HistoryView />}
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
