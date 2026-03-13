# Architecture

This document is the canonical reference for the workout tracker's structure, state, and design decisions. It is intended to reduce the need to read source code to understand how the app works, and to guide long-term maintenance.

---

## Purpose

A personal workout and nutrition tracker for a 9-day Push/Pull/Legs + cardio cycle. Users log training sets, track meals, and review performance over time. The app is multi-tenant by design — all data is scoped to the authenticated user.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Build tool | Vite | 7 |
| Styling | Tailwind CSS (v4, Vite plugin) | 4 |
| Backend / Auth / DB | Supabase | 2 |
| Hosting | Azure Static Web Apps | — |

**No routing library.** Navigation is managed via React state in `App.jsx`.
**No Redux or Zustand.** State management uses React Context + component-local state.

---

## Directory Structure

```
src/
├── App.jsx                    # Root component; owns all navigation state
├── main.jsx                   # Entry point, mounts React
├── index.css                  # Global styles: Tailwind + CSS variables + custom classes
│
├── components/
│   ├── LoginPage.jsx          # Auth: sign in / sign up
│   ├── CycleView.jsx          # Workout tab: 9-day cycle overview
│   ├── WorkoutView.jsx        # Workout tab: active session, logging sets
│   ├── HistoryView.jsx        # Workout tab: past sessions, set detail, export
│   ├── ProgramView.jsx        # Workout tab: static training reference (accordion)
│   ├── AnalyticsView.jsx      # Workout tab: stats dashboard
│   ├── NutritionView.jsx      # Nutrition tab: sub-router
│   ├── MealView.jsx           # Nutrition tab: log a meal
│   ├── MealHistory.jsx        # Nutrition tab: past meals
│   ├── AccountView.jsx        # Account tab: settings, password change, CSV export
│   ├── BottomNav.jsx          # Persistent tab bar at bottom of screen
│   └── ui.jsx                 # Shared presentational components (SectionLabel, TypeBadge, etc.)
│
├── contexts/
│   ├── AuthContext.jsx        # React.createContext() for auth
│   ├── AuthContextValue.jsx   # Type/shape definition for auth context
│   ├── AuthProvider.jsx       # Session management logic; wraps the entire app
│   ├── useAuth.jsx            # Hook: consumers call useAuth() to access { user, loading }
│   ├── SettingsContext.jsx    # React.createContext() for user preferences
│   ├── SettingsContextValue.jsx
│   ├── SettingsProvider.jsx   # Persists to localStorage (key: wt_settings)
│   └── useSettings.jsx        # Hook: consumers call useSettings() to access { weightUnit, setWeightUnit }
│
└── lib/
    ├── supabase.js            # Supabase client singleton, reads VITE_SUPABASE_* env vars
    ├── workoutDefinitions.js  # Hardcoded 9-day cycle: exercise names, set counts, notes
    ├── units.js               # Weight conversion helpers (lbs ↔ kg)
    └── export.js              # CSV generation and download (runs entirely in the browser)

supabase/
└── migrations/
    ├── 001_initial_schema.sql  # workouts + sets tables, RLS policies
    ├── 002_add_meals_table.sql # meals table, RLS policies
    └── 002_skip_note.md        # Migration numbering note
```

---

## Database Schema

All tables enforce Row Level Security (RLS). Every row is owned by a user via `user_id` (FK → `auth.users.id`, cascade delete). Queries must include `.eq('user_id', user.id)`.

### workouts

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → auth.users, cascade delete |
| day_number | int | 1–9 (maps to WORKOUT_CYCLE) |
| workout_type | text | "Push A", "Pull B", "Legs", "VO2", "Zone 2", "Rest" |
| completed_at | timestamptz | Default: now() |
| notes | text | Optional; value `"SKIPPED"` marks a skipped session |

Indexes: `user_id`, `completed_at DESC`

### sets

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| workout_id | uuid | FK → workouts, cascade delete |
| user_id | uuid | FK → auth.users, cascade delete |
| exercise_name | text | Must match a name from workoutDefinitions.js |
| set_number | int | 1-based |
| weight_lbs | numeric | Nullable; stored in lbs, converted for display via units.js |
| reps | int | Nullable |
| completed | boolean | Default: false |

Indexes: `workout_id`, `user_id`

### meals

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK → auth.users, cascade delete |
| name | text | Meal name; used for autocomplete in MealView |
| calories | int | Default: 0 |
| protein | int | Nullable (grams) |
| carbs | int | Nullable (grams) |
| fats | int | Nullable (grams) |
| notes | text | Nullable |
| consumed_at | timestamptz | Default: now() |

Indexes: `user_id`, `consumed_at DESC`

### Relationships

```
auth.users (Supabase-managed)
├── workouts (1:N)
│   └── sets (1:N, cascade delete on workout delete)
└── meals (1:N)
```

---

## State Management

State in this app lives in three distinct tiers.

### Tier 1 — Global Auth State (`AuthContext`)

**Where:** `src/contexts/AuthProvider.jsx`
**Accessed via:** `useAuth()` hook
**Shape:** `{ user: SupabaseUser | null, loading: boolean }`

Lifecycle:
1. On mount, calls `supabase.auth.getSession()` — sets `user` from existing session.
2. Subscribes to `supabase.auth.onAuthStateChange()` for token refresh and sign-out events.
3. `loading` is `true` until the session check resolves; the app renders nothing (or a spinner) during this window to prevent flash-of-unauthenticated-content.

### Tier 2 — User Preferences (`SettingsContext`)

**Where:** `src/contexts/SettingsProvider.jsx`
**Accessed via:** `useSettings()` hook
**Shape:** `{ weightUnit: 'lbs' | 'kg', setWeightUnit: fn }`
**Persistence:** `localStorage` under key `wt_settings`

All weight values are stored in the database in **lbs**. `units.js` converts for display based on `weightUnit`. This is a deliberate one-way contract: the DB is always lbs, the UI adapts.

### Tier 3 — Navigation State (`App.jsx`)

**Where:** `src/App.jsx` — local `useState` only, not in context.

| State variable | Type | Purpose |
|---|---|---|
| `activeSection` | `'workout' \| 'nutrition' \| 'account'` | Which bottom tab is active |
| `workoutTab` | `'cycle' \| 'history' \| 'program' \| 'analytics'` | Workout sub-tab |
| `nutritionTab` | `'log' \| 'history' \| 'program' \| 'analytics'` | Nutrition sub-tab |
| `selectedDay` | `number \| null` | If set, renders WorkoutView for that day number instead of CycleView |

This is intentionally not in a context. Navigation state belongs to the AppShell and does not need to be consumed by deeply nested components.

### Tier 4 — Component-Local State

Each view component owns its own data-fetching and form state. The pattern is consistent:

```
useEffect → supabase query → setState(data) → render
```

Components do not share server data with siblings. If two views need the same data, they each fetch it independently. This is acceptable given the app's scale.

---

## Routing

There is no URL router. Navigation is purely state-driven. The URL never changes.

```
App.jsx (renders one of:)
│
├── [unauthenticated] → LoginPage
│
└── [authenticated] → AppShell
    ├── activeSection === 'workout'
    │   ├── selectedDay !== null → WorkoutView
    │   ├── workoutTab === 'cycle'     → CycleView
    │   ├── workoutTab === 'history'   → HistoryView
    │   ├── workoutTab === 'program'   → ProgramView
    │   └── workoutTab === 'analytics' → AnalyticsView
    │
    ├── activeSection === 'nutrition'
    │   ├── nutritionTab === 'log'     → MealView
    │   └── nutritionTab === 'history' → MealHistory
    │
    └── activeSection === 'account'   → AccountView
```

**Implication:** Deep linking and browser back/forward do not work. This is a known trade-off accepted for simplicity. If URL-based navigation is added in the future, React Router v7 (file-based) is the recommended path.

---

## Data Flow

```
User action
  ↓
Component local state update (optimistic UI if applicable)
  ↓
Supabase SDK call (insert / update / delete / select)
  ↓
Response → setState(data) or setError(msg)
  ↓
Re-render
```

All Supabase calls are made **directly from components**. There is no API abstraction layer or service class. This is acceptable at current scale; if query logic is duplicated across more than two components, it should be extracted to a custom hook in `src/lib/`.

### Key query patterns

```js
// Fetch latest workout (used in CycleView to determine current day)
supabase.from('workouts')
  .select('*')
  .eq('user_id', user.id)
  .order('completed_at', { ascending: false })
  .limit(1)
  .single()

// Fetch sets for a workout
supabase.from('sets')
  .select('*')
  .eq('workout_id', workoutId)
  .order('exercise_name')
  .order('set_number')

// Batch update sets (used in WorkoutView on completion)
await Promise.all(sets.map(s =>
  supabase.from('sets').update({ completed: true, weight_lbs: s.weight, reps: s.reps }).eq('id', s.id)
))
```

---

## Workout Definitions

The 9-day cycle is defined entirely in `src/lib/workoutDefinitions.js` as a static JS object — it is **not stored in the database**. This is intentional: the program structure is fixed and does not vary per user.

The object exported (`WORKOUT_CYCLE`) maps `day_number` (1–9) to:
- `workout_type` — string label stored in the `workouts.workout_type` column
- `exercises` — array of `{ name, sets, reps, notes }` objects

When a workout is logged, `day_number` is stored in the DB. The exercise list is always reconstructed from `workoutDefinitions.js` at render time using that day number as the key.

**If the program changes**, update `workoutDefinitions.js`. Historical workout records are unaffected because sets store `exercise_name` as a plain string, not a foreign key to the definitions.

---

## Authentication

Provider: Supabase Auth (email/password only).

| Operation | SDK call |
|---|---|
| Sign in | `supabase.auth.signInWithPassword({ email, password })` |
| Sign up | `supabase.auth.signUp({ email, password })` |
| Sign out | `supabase.auth.signOut()` |
| Change password | `supabase.auth.updateUser({ password })` |

The `user.id` (UUID) from the Supabase session is used as `user_id` on every DB write. RLS on the Supabase side enforces that reads and writes are always scoped to `auth.uid()`.

---

## Environment Configuration

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |

Set in `.env` for local development. In Azure Static Web Apps, set as application settings. Variables must use the `VITE_` prefix to be accessible in the browser bundle.

---

## Design System

### Typography

Three font families used consistently:

| Font | Use |
|---|---|
| Bebas Neue | Display headings, day numbers, large labels |
| DM Mono | Metadata, badges, monospace UI elements |
| DM Sans | Body text, form inputs, descriptions |

### Color

Dark-only. Background: `#0a0a0a`.

Workout type colors (defined in `WORKOUT_COLORS` in `workoutDefinitions.js`):

| Type | Color |
|---|---|
| Push | `#ff6b35` (orange) |
| Pull | `#4af0ff` (cyan) |
| Legs | `#e8ff4a` (lime) |
| VO2 | `#ff3b3b` (red) |
| Zone 2 | `#a78bfa` (purple) |
| Rest | `#444444` (gray) |

### Layout

- Max width: `680px`, centered (constant in `App.jsx`)
- Mobile-first; breakpoint for small adjustments at `520px`
- Uses `100dvh` (dynamic viewport height) to handle mobile browser chrome
- `viewport-fit=cover` in `index.html` for notch-safe rendering
- Bottom navigation bar is always visible when authenticated

### Styling approach

Tailwind utility classes are used selectively. Most per-component styles are inline `style` objects. Custom reusable CSS classes (`.page`, `.cycle-grid`, `.type-badge`, `.muscle-tag`, `.section-label`) live in `src/index.css` using `@layer components`.

---

## Known Gaps and Future Considerations

| Area | Current state | Potential improvement |
|---|---|---|
| URL routing | State-only, no deep links | React Router v7 |
| Offline support | None | Service worker + IndexedDB sync |
| Nutrition analytics | Stubbed ("coming soon") | Build out like AnalyticsView |
| Multiple programs | Single hardcoded 9-day cycle | Store programs in DB, user selects |
| Test coverage | None | Vitest + React Testing Library |
| Error boundaries | None | Add at view level to prevent full-app crashes |
| Loading states | Inconsistent (some views have none) | Unified skeleton/loading pattern |
| Weight storage | Always lbs in DB | Consider adding a `unit` column if multi-unit storage is ever needed |
| Mobile Support | None | Convert to iPhone app????? |
| Deleting History Sessions is not visibly immediate | None | Delete should be instant |
| Adjust Run Times | None | Should be able to input run times and milage and such, to keep track of progress and better feed analytics |
| 