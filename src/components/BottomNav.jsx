export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'cycle', label: 'Cycle', icon: '⬡' },
    { id: 'history', label: 'History', icon: '📋' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-6 pb-safe"
      style={{
        backgroundColor: '#0d0d0d',
        borderTop: '1px solid #1f1f1f',
        height: '68px',
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-1 flex-1 transition-opacity"
            style={{ opacity: isActive ? 1 : 0.4 }}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span
              className="text-xs font-medium"
              style={{ color: isActive ? '#ff6b35' : '#9ca3af' }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
