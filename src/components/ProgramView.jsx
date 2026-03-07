export default function ProgramView() {
  return (
    <div style={{ height: 'calc(100dvh - 120px)', overflow: 'hidden' }}>
      <iframe
        src="/program.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="PPL + VO2 Max Program"
      />
    </div>
  )
}
