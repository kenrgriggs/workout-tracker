# Testing Strategy

This document covers why testing matters for this codebase specifically, what the test setup looks like, and how to write and run tests at each layer of the app.

---

## Why tests matter here

### The AI feedback loop problem

When an AI model writes or modifies code, it has no way to verify the result. It reads the file, makes changes, and reports success — but it cannot run the app or observe what actually happens. Every change is made blind.

Tests change this. A failing test is objective ground truth: the code is wrong in a specific, describable way. A passing test suite after a code change is a meaningful signal that nothing was broken.

The workflow this enables:

```
"Write tests for what you just built, then run them and fix any failures."
```

This turns a one-shot code generation into a self-correction loop:
1. Write code
2. Write tests
3. Run tests — failures pinpoint exactly what's wrong
4. Fix the failures
5. Re-run until green

Without tests, the only feedback is "does it look right?" With tests, the feedback is exact.

### TDD for new features

Test-driven development flips the order: write the tests first, then write the code that makes them pass. For AI-assisted development this is especially powerful because:

- The tests act as a specification — they define the expected behavior before any code is written
- The model writes code to satisfy a concrete, verifiable contract instead of an ambiguous description
- Edge cases are defined upfront, not discovered later

**Pattern:**
```
"Before writing the feature, write failing tests that describe what it should do.
Then implement the feature and make the tests pass."
```

---

## The testing stack

| Tool | Role | Why |
|---|---|---|
| **Vitest** | Test runner | Native to Vite — zero config, same module resolution as the app, fast |
| **React Testing Library** | Component testing | Tests behavior, not implementation — like a user, not a developer |
| **@testing-library/jest-dom** | DOM assertions | Adds `.toBeInTheDocument()`, `.toHaveTextContent()`, etc. |
| **@testing-library/user-event** | Input simulation | Simulates real user interactions (typing, clicking) more accurately than `fireEvent` |
| **jsdom** | Browser environment | Vitest runs in Node; jsdom provides a fake browser DOM for component tests |

No MSW (Mock Service Worker). Supabase is mocked at the module level with `vi.mock`. MSW adds significant complexity and is better suited for apps with a REST API layer — this app calls Supabase directly, so a module mock is simpler and more direct.

---

## Setup

### 1. Install dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 2. Add Vitest to `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,   // skip CSS processing in tests — not needed for behavior tests
  },
})
```

### 3. Create the setup file

**`src/test/setup.js`**
```js
import '@testing-library/jest-dom'
```

This imports the DOM assertion matchers (`.toBeInTheDocument()`, `.toHaveValue()`, etc.) globally so they're available in every test file without importing.

### 4. Add test scripts to `package.json`

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "test:ui": "vitest --ui"
}
```

- `npm test` — watch mode, re-runs on file changes (use during development)
- `npm run test:run` — run once and exit (use in CI or for a final check)
- `npm run test:ui` — opens a browser UI showing test results (requires `@vitest/ui`)

### 5. Create the test directory

Tests live next to the files they test, using `.test.jsx` / `.test.js` suffixes:

```
src/
├── lib/
│   ├── units.js
│   ├── units.test.js        ← tests for units.js
│   ├── export.js
│   ├── export.test.js
│   ├── workoutDefinitions.js
│   └── workoutDefinitions.test.js
├── components/
│   ├── MealView.jsx
│   ├── MealView.test.jsx    ← tests for MealView
│   └── ...
└── test/
    ├── setup.js             ← global setup
    └── mocks/
        ├── supabase.js      ← shared Supabase mock
        └── contexts.jsx     ← shared context wrappers
```

---

## The Supabase mocking problem

Every component calls Supabase directly. Running real Supabase calls in tests is not viable — it requires a network connection, modifies production/test data, and makes tests slow and unreliable.

The solution is to mock the entire `supabase` module so that `.from().select().eq()...` chains return controlled fake data.

The challenge: Supabase uses a builder pattern where every method returns `this`, and the final chain is awaited as a Promise. The mock must replicate this.

**`src/test/mocks/supabase.js`**

```js
import { vi } from 'vitest'

// Creates a chainable mock where every method returns `this`,
// and the chain itself is awaitable (via .then).
export function createSupabaseMock(defaultResult = { data: [], error: null }) {
  let result = defaultResult

  const chain = {
    select:  vi.fn().mockReturnThis(),
    insert:  vi.fn().mockReturnThis(),
    upsert:  vi.fn().mockReturnThis(),
    update:  vi.fn().mockReturnThis(),
    delete:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    neq:     vi.fn().mockReturnThis(),
    in:      vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    limit:   vi.fn().mockReturnThis(),
    single:  vi.fn(() => Promise.resolve(result)),
    // Makes the entire chain awaitable
    then:    (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }

  // Lets individual tests override the resolved data
  chain.mockResolve = (newResult) => { result = newResult }

  return chain
}

export function createAuthMock(user = null) {
  return {
    getSession: vi.fn().mockResolvedValue({
      data: { session: user ? { user } : null },
      error: null,
    }),
    onAuthStateChange: vi.fn((callback) => {
      // Immediately fire with the initial state
      callback('INITIAL_SESSION', user ? { user } : null)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
  }
}
```

**`src/test/mocks/contexts.jsx`**

A wrapper that provides the contexts every component expects, pre-filled with a fake logged-in user:

```jsx
import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { AuthContext } from '../../contexts/AuthContext'
import { SettingsContext } from '../../contexts/SettingsContext'

const FAKE_USER = { id: 'test-user-id', email: 'test@example.com' }

export function AppWrapper({ children, user = FAKE_USER, weightUnit = 'lbs' }) {
  const authValue = { user, loading: false }
  const settingsValue = { weightUnit, setWeightUnit: vi.fn() }

  return (
    <AuthContext.Provider value={authValue}>
      <SettingsContext.Provider value={settingsValue}>
        {children}
      </SettingsContext.Provider>
    </AuthContext.Provider>
  )
}

// Convenience: wrap a component in all providers and render it
export function renderWithProviders(ui, options = {}) {
  const { user, weightUnit, ...renderOptions } = options
  return render(
    <AppWrapper user={user} weightUnit={weightUnit}>
      {ui}
    </AppWrapper>,
    renderOptions
  )
}
```

---

## Layer 1 — Pure utility tests

The easiest tests to write. These functions have no dependencies — inputs in, output out.

**`src/lib/units.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { lbsToUnit, unitToLbs, WEIGHT_UNITS } from './units'

describe('lbsToUnit', () => {
  it('returns the value unchanged when unit is lbs', () => {
    expect(lbsToUnit(100, WEIGHT_UNITS.LBS)).toBe(100)
  })

  it('converts lbs to kg', () => {
    expect(lbsToUnit(100, WEIGHT_UNITS.KG)).toBe(45.4)
  })

  it('rounds to one decimal place', () => {
    expect(lbsToUnit(155, WEIGHT_UNITS.KG)).toBe(70.3)
  })

  it('returns empty string for null', () => {
    expect(lbsToUnit(null, WEIGHT_UNITS.LBS)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(lbsToUnit('', WEIGHT_UNITS.KG)).toBe('')
  })

  it('returns empty string for non-numeric input', () => {
    expect(lbsToUnit('heavy', WEIGHT_UNITS.LBS)).toBe('')
  })
})

describe('unitToLbs', () => {
  it('returns the value unchanged when unit is lbs', () => {
    expect(unitToLbs(100, WEIGHT_UNITS.LBS)).toBe(100)
  })

  it('converts kg to lbs', () => {
    expect(unitToLbs(45.4, WEIGHT_UNITS.KG)).toBe(100.1)
  })

  it('returns empty string for null', () => {
    expect(unitToLbs(null, WEIGHT_UNITS.KG)).toBe('')
  })
})
```

**`src/lib/workoutDefinitions.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { WORKOUT_CYCLE, getWorkoutDay, WORKOUT_COLORS } from './workoutDefinitions'

describe('WORKOUT_CYCLE', () => {
  it('has exactly 9 days', () => {
    expect(WORKOUT_CYCLE).toHaveLength(9)
  })

  it('has sequential day numbers from 1 to 9', () => {
    const days = WORKOUT_CYCLE.map(d => d.day)
    expect(days).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('every day has a type', () => {
    WORKOUT_CYCLE.forEach(day => {
      expect(day.type).toBeTruthy()
    })
  })

  it('lift days have at least one exercise', () => {
    const liftDays = WORKOUT_CYCLE.filter(d => !d.rest && !d.notesOnly)
    liftDays.forEach(day => {
      expect(day.exercises.length).toBeGreaterThan(0)
    })
  })

  it('rest days have empty exercises array', () => {
    const restDays = WORKOUT_CYCLE.filter(d => d.rest)
    restDays.forEach(day => {
      expect(day.exercises).toEqual([])
    })
  })
})

describe('getWorkoutDay', () => {
  it('returns the correct day by number', () => {
    const day = getWorkoutDay(1)
    expect(day.type).toBe('Push A')
    expect(day.day).toBe(1)
  })

  it('returns the rest day', () => {
    const day = getWorkoutDay(5)
    expect(day.type).toBe('Rest')
    expect(day.rest).toBe(true)
  })

  it('returns undefined for an out-of-range day number', () => {
    expect(getWorkoutDay(0)).toBeUndefined()
    expect(getWorkoutDay(10)).toBeUndefined()
  })
})

describe('WORKOUT_COLORS', () => {
  it('has a color for every workout type in the cycle', () => {
    const types = [...new Set(WORKOUT_CYCLE.map(d => d.type))]
    types.forEach(type => {
      expect(WORKOUT_COLORS[type]).toBeTruthy()
    })
  })
})
```

**`src/lib/export.test.js`**

`downloadCSV` is mostly side effects (DOM manipulation, Blob), but the CSV formatting logic is what actually matters and can be tested by extracting it:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadCSV } from './export'

// Mock browser APIs that don't exist in jsdom
beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()
  // Mock anchor click to prevent navigation
  const mockAnchor = { href: '', download: '', click: vi.fn() }
  vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})
})

describe('downloadCSV', () => {
  it('creates a blob and triggers a download', () => {
    downloadCSV('test.csv', ['Name', 'Calories'], [['Oats', '350']])
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('escapes double quotes in cell values', () => {
    // Create a spy on Blob to inspect the content passed to it
    const blobSpy = vi.spyOn(global, 'Blob').mockImplementation(function(parts) {
      this.content = parts[0]
    })
    downloadCSV('test.csv', ['Name'], [['"Fancy" Oats']])
    expect(blobSpy.mock.instances[0].content).toContain('""Fancy""')
  })

  it('uses the provided filename', () => {
    const anchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    downloadCSV('my-export.csv', ['Col'], [['val']])
    expect(anchor.download).toBe('my-export.csv')
  })
})
```

---

## Layer 2 — Context tests

Test that the providers correctly supply values to consumers and respond to state changes.

**`src/contexts/SettingsProvider.test.jsx`**

```jsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsProvider } from './SettingsProvider'
import { useSettings } from './useSettings'

// A helper component that renders the context values for inspection
function SettingsConsumer() {
  const { weightUnit, setWeightUnit } = useSettings()
  return (
    <div>
      <span data-testid="unit">{weightUnit}</span>
      <button onClick={() => setWeightUnit('kg')}>Switch to kg</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('SettingsProvider', () => {
  it('defaults to lbs', () => {
    render(<SettingsProvider><SettingsConsumer /></SettingsProvider>)
    expect(screen.getByTestId('unit')).toHaveTextContent('lbs')
  })

  it('reads initial value from localStorage', () => {
    localStorage.setItem('wt_settings', JSON.stringify({ weightUnit: 'kg' }))
    render(<SettingsProvider><SettingsConsumer /></SettingsProvider>)
    expect(screen.getByTestId('unit')).toHaveTextContent('kg')
  })

  it('updates and persists the weight unit', async () => {
    render(<SettingsProvider><SettingsConsumer /></SettingsProvider>)
    await userEvent.click(screen.getByText('Switch to kg'))
    expect(screen.getByTestId('unit')).toHaveTextContent('kg')
    const stored = JSON.parse(localStorage.getItem('wt_settings'))
    expect(stored.weightUnit).toBe('kg')
  })
})
```

---

## Layer 3 — Component tests

Component tests verify that a component renders the right thing and responds correctly to user interaction. They do not test implementation details (which functions were called) — they test what the user sees.

The key: mock Supabase before the component loads, control what data it "returns", then assert on the rendered output.

**`src/components/MealHistory.test.jsx`**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MealHistory from './MealHistory'
import { AppWrapper } from '../test/mocks/contexts'

// Mock the supabase module entirely
vi.mock('../lib/supabase', () => {
  const chain = {
    select:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    then:    (resolve) => Promise.resolve({ data: [], error: null }).then(resolve),
  }
  return { supabase: { from: vi.fn(() => chain) } }
})

// Grab the mock so we can change its resolved data per test
import { supabase } from '../lib/supabase'

const FAKE_MEALS = [
  { id: '1', name: 'Oatmeal', calories: 350, protein: 12, carbs: 60, fats: 6, consumed_at: '2024-01-15T08:00:00Z', notes: null },
  { id: '2', name: 'Chicken Rice', calories: 520, protein: 45, carbs: 65, fats: 8, consumed_at: '2024-01-15T12:00:00Z', notes: null },
]

function renderComponent() {
  return render(<AppWrapper><MealHistory /></AppWrapper>)
}

describe('MealHistory', () => {
  it('shows a loading state initially', () => {
    renderComponent()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders meal names after loading', async () => {
    supabase.from().then = (resolve) =>
      Promise.resolve({ data: FAKE_MEALS, error: null }).then(resolve)

    renderComponent()
    await waitFor(() => screen.getByText('Oatmeal'))
    expect(screen.getByText('Chicken Rice')).toBeInTheDocument()
  })

  it('shows calorie totals', async () => {
    supabase.from().then = (resolve) =>
      Promise.resolve({ data: FAKE_MEALS, error: null }).then(resolve)

    renderComponent()
    await waitFor(() => screen.getByText('870')) // 350 + 520
  })

  it('shows empty state when no meals exist', async () => {
    supabase.from().then = (resolve) =>
      Promise.resolve({ data: [], error: null }).then(resolve)

    renderComponent()
    await waitFor(() =>
      expect(screen.getByText(/no meals yet/i)).toBeInTheDocument()
    )
  })
})
```

**`src/components/NutritionAnalyticsView.test.jsx`**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import NutritionAnalyticsView from './NutritionAnalyticsView'
import { AppWrapper } from '../test/mocks/contexts'

vi.mock('../lib/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    order:  vi.fn().mockReturnThis(),
    then:   (resolve) => Promise.resolve({ data: [], error: null }).then(resolve),
  }
  return { supabase: { from: vi.fn(() => chain) } }
})

import { supabase } from '../lib/supabase'

const FAKE_MEALS = [
  { id: '1', name: 'Oatmeal',      calories: 350, protein: 12, carbs: 55, fats: 6,  consumed_at: '2024-01-15T08:00:00Z' },
  { id: '2', name: 'Chicken Rice', calories: 520, protein: 45, carbs: 65, fats: 8,  consumed_at: '2024-01-15T12:00:00Z' },
  { id: '3', name: 'Oatmeal',      calories: 350, protein: 12, carbs: 55, fats: 6,  consumed_at: '2024-01-16T08:00:00Z' },
]

describe('NutritionAnalyticsView', () => {
  it('shows empty state with no meals', async () => {
    render(<AppWrapper><NutritionAnalyticsView /></AppWrapper>)
    await waitFor(() =>
      expect(screen.getByText(/log some meals/i)).toBeInTheDocument()
    )
  })

  it('shows days tracked stat', async () => {
    supabase.from().then = (resolve) =>
      Promise.resolve({ data: FAKE_MEALS, error: null }).then(resolve)

    render(<AppWrapper><NutritionAnalyticsView /></AppWrapper>)
    // FAKE_MEALS spans 2 distinct days
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument())
  })

  it('shows most logged meal', async () => {
    supabase.from().then = (resolve) =>
      Promise.resolve({ data: FAKE_MEALS, error: null }).then(resolve)

    render(<AppWrapper><NutritionAnalyticsView /></AppWrapper>)
    // Oatmeal appears twice so it should be first in Most Logged
    await waitFor(() => {
      const names = screen.getAllByText('Oatmeal')
      expect(names.length).toBeGreaterThan(0)
    })
  })

  it('shows logged 2× for oatmeal', async () => {
    supabase.from().then = (resolve) =>
      Promise.resolve({ data: FAKE_MEALS, error: null }).then(resolve)

    render(<AppWrapper><NutritionAnalyticsView /></AppWrapper>)
    await waitFor(() =>
      expect(screen.getByText(/logged 2×/i)).toBeInTheDocument()
    )
  })
})
```

---

## Running the tests

```bash
# Watch mode — re-runs on file save (use this while writing code)
npm test

# Single run — use this after finishing a feature
npm run test:run

# Run tests for a specific file
npx vitest run src/lib/units.test.js

# Run with coverage report
npx vitest run --coverage
```

---

## What to write first

Work outward from the simplest code. Each layer gives you confidence before testing the next.

**Priority order:**

1. `src/lib/units.test.js` — pure math, no dependencies, zero setup
2. `src/lib/workoutDefinitions.test.js` — static data assertions, trivial to write
3. `src/lib/export.test.js` — slightly more setup (DOM mocks), but isolated
4. `src/contexts/SettingsProvider.test.jsx` — introduces context + localStorage testing
5. `src/components/MealHistory.test.jsx` — introduces the Supabase mock pattern
6. `src/components/NutritionAnalyticsView.test.jsx` — builds on the meal history pattern
7. `src/components/MealView.test.jsx` — adds form interaction testing
8. `src/components/CycleView.test.jsx` — tests the day calculation logic
9. `src/components/AnalyticsView.test.jsx`

---

## The TDD workflow for new features

When adding a new feature, follow this order:

**1. Write the tests first (they will fail)**
```
"Write tests for a [feature description]. The tests should cover:
- the happy path (normal use)
- the empty state
- the error state
The tests should fail since the feature doesn't exist yet."
```

**2. Implement the feature**
```
"Now implement [feature] so that the tests pass.
Run the tests after and fix any failures."
```

**3. After finishing, verify nothing regressed**
```
npm run test:run
```

---

## The self-correction prompt

After any code change — feature or bug fix — use this prompt:

```
Run the test suite. For each failing test, explain why it's failing and fix it.
Do not change the test to match broken code — fix the code to match the test.
```

The rule "fix the code, not the test" is important. A test that gets weakened to pass is worse than no test at all.

---

## New files summary

| File | Purpose |
|---|---|
| `src/test/setup.js` | Global test setup, imports jest-dom matchers |
| `src/test/mocks/supabase.js` | Reusable chainable Supabase mock factory |
| `src/test/mocks/contexts.jsx` | AppWrapper and renderWithProviders helpers |
| `src/lib/units.test.js` | Unit tests for weight conversion |
| `src/lib/workoutDefinitions.test.js` | Unit tests for workout cycle data |
| `src/lib/export.test.js` | Unit tests for CSV export |
| `src/contexts/SettingsProvider.test.jsx` | Context and localStorage behavior |
| `src/components/MealHistory.test.jsx` | Component tests for meal history view |
| `src/components/NutritionAnalyticsView.test.jsx` | Component tests for nutrition analytics |

## Modified files summary

| File | Change |
|---|---|
| `vite.config.js` | Add `test` block with jsdom environment and setup file |
| `package.json` | Add test scripts and dev dependencies |

## Dependencies to add

| Package | Why |
|---|---|
| `vitest` | Test runner |
| `@testing-library/react` | Component rendering utilities |
| `@testing-library/jest-dom` | DOM assertion matchers |
| `@testing-library/user-event` | Realistic user input simulation |
| `jsdom` | Browser DOM environment for Node |
