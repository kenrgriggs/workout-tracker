export default function BottomNav({ tabs = [], activeTab, onTabChange }) {
  if (!tabs?.length) return null

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="bottom-nav-icon">{tab.icon}</span>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
