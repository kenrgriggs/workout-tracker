export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'cycle', label: 'Cycle', icon: '◈' },
    { id: 'history', label: 'History', icon: '▤' },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#0a0a0acc',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid #191919',
        height: 64,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: isActive ? 1 : 0.35,
              transition: 'opacity 0.15s',
              height: '100%',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: 16,
              color: isActive ? '#ff6b35' : '#888',
              lineHeight: 1,
            }}>
              {tab.icon}
            </span>
            <span style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 14,
              letterSpacing: '0.08em',
              color: isActive ? '#ff6b35' : '#888',
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
