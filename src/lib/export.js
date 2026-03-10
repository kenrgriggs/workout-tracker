export function downloadCSV(filename, headers, rows) {
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
