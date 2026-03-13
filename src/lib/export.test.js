import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadCSV } from './export'

let capturedBlobContent = ''

beforeEach(() => {
  capturedBlobContent = ''
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  URL.revokeObjectURL = vi.fn()
  // Blob must be a constructor — arrow functions and vi.fn() implementations
  // can't be used with `new`. A class works correctly.
  window.Blob = class {
    constructor(parts) {
      capturedBlobContent = parts[0]
      this.size = parts[0].length
      this.type = 'text/csv'
    }
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

function withAnchor(fn) {
  const anchor = { href: '', download: '', click: vi.fn() }
  vi.spyOn(document, 'createElement').mockReturnValue(anchor)
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
  fn(anchor)
  return anchor
}

describe('downloadCSV', () => {
  it('triggers a click on an anchor element', () => {
    const anchor = withAnchor(() => {
      downloadCSV('test.csv', ['Name'], [['Oats']])
    })
    expect(anchor.click).toHaveBeenCalledOnce()
  })

  it('sets the correct filename on the anchor', () => {
    const anchor = withAnchor(() => {
      downloadCSV('my-export.csv', ['Name'], [['val']])
    })
    expect(anchor.download).toBe('my-export.csv')
  })

  it('writes headers as the first CSV row', () => {
    withAnchor(() => downloadCSV('test.csv', ['Name', 'Calories', 'Protein'], []))
    const firstLine = capturedBlobContent.split('\n')[0]
    expect(firstLine).toBe('Name,Calories,Protein')
  })

  it('wraps each cell in double quotes', () => {
    withAnchor(() => downloadCSV('test.csv', ['Name'], [['Chicken Rice']]))
    expect(capturedBlobContent).toContain('"Chicken Rice"')
  })

  it('escapes double quotes inside cell values', () => {
    withAnchor(() => downloadCSV('test.csv', ['Name'], [['"Fancy" Oats']]))
    expect(capturedBlobContent).toContain('""Fancy""')
  })

  it('handles null cell values without throwing', () => {
    expect(() => withAnchor(() => downloadCSV('test.csv', ['Notes'], [[null]]))).not.toThrow()
  })

  it('handles undefined cell values without throwing', () => {
    expect(() => withAnchor(() => downloadCSV('test.csv', ['Notes'], [[undefined]]))).not.toThrow()
  })

  it('produces one row per data entry plus the header', () => {
    withAnchor(() => {
      downloadCSV('test.csv', ['Name', 'Cal'], [['Oats', '350'], ['Chicken', '520'], ['Rice', '200']])
    })
    expect(capturedBlobContent.split('\n')).toHaveLength(4)
  })

  it('revokes the object URL after download', () => {
    withAnchor(() => downloadCSV('test.csv', ['Name'], [['val']]))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  // With no data rows the output should be just the header line — no trailing newline,
  // no phantom empty row. Callers export empty datasets (e.g. no workouts logged yet).
  it('produces only the header line when rows is empty', () => {
    withAnchor(() => downloadCSV('test.csv', ['Name', 'Calories'], []))
    expect(capturedBlobContent).toBe('Name,Calories')
  })

  // null and undefined cell values should render as an empty quoted string (""),
  // not the literal text "null" or "undefined". Verified by content, not just no-throw.
  it('renders null cell as empty quoted string', () => {
    withAnchor(() => downloadCSV('test.csv', ['Notes'], [[null]]))
    expect(capturedBlobContent).toContain('""')
    expect(capturedBlobContent).not.toContain('"null"')
  })

  it('renders undefined cell as empty quoted string', () => {
    withAnchor(() => downloadCSV('test.csv', ['Notes'], [[undefined]]))
    expect(capturedBlobContent).toContain('""')
    expect(capturedBlobContent).not.toContain('"undefined"')
  })

  // Commas inside a cell value must be preserved — the surrounding quotes are what
  // prevent CSV parsers from treating them as column separators.
  it('preserves commas inside cell values via quoting', () => {
    withAnchor(() => downloadCSV('test.csv', ['Notes'], [['3 sets, 10 reps']]))
    expect(capturedBlobContent).toContain('"3 sets, 10 reps"')
  })
})