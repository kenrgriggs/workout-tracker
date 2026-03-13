// Triggers a CSV file download entirely in the browser — no server needed.
// The anchor-click approach is the only reliable cross-browser way to set a filename.
// The `download` attribute on the anchor tells the browser to save (not navigate),
// but it only works when the element is temporarily in the DOM, hence the
// appendChild / click / removeChild sequence.
export function downloadCSV(filename, headers, rows) {
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      // RFC 4180: every field is quoted, and any literal `"` in a value is escaped as `""`.
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
  // Release the object URL to free the memory held by the Blob.
  URL.revokeObjectURL(url)
}
