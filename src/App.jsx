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
      <div className="min-h-dvh flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  if (selectedDay !== null) {
    return (
      <WorkoutView
        dayNumber={selectedDay}
        onBack={() => setSelectedDay(null)}
        onFinish={() => {
          setSelectedDay(null)
          setActiveTab('history')
        }}
      />
    )
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#0a0a0a' }}>
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #141414' }}
      >
        <h1 className="text-lg font-bold text-white">💪 Workout Tracker</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-gray-600 text-xs px-3 py-1.5 rounded-lg"
          style={{ border: '1px solid #1f1f1f' }}
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
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
