import { WORKOUT_COLORS } from '../lib/workoutDefinitions'

export function SectionLabel({ children }) {
  return <div className="section-label">{children}</div>
}

export function TypeBadge({ type }) {
  const color = WORKOUT_COLORS[type] ?? '#555'
  return (
    <span
      className="type-badge"
      style={{ backgroundColor: `${color}28`, color }}
    >
      {type}
    </span>
  )
}

export function TimingBar({ timing }) {
  if (!timing?.length) return null
  return (
    <div className="timing-bar">
      {timing.map((t, i) => (
        <span key={t.label}>
          {t.label}:{' '}
          <span style={{ color: '#e0e0e0', fontWeight: 500 }}>{t.value}</span>
          {i < timing.length - 1 && <span className="timing-sep">|</span>}
        </span>
      ))}
    </div>
  )
}

export function MuscleTags({ muscles }) {
  if (!muscles?.length) return null
  return (
    <span>
      {muscles.map(m => (
        <span key={m} className="muscle-tag">{m}</span>
      ))}
    </span>
  )
}
