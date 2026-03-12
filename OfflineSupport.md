# Offline Support Plan

This document breaks down what it would take to make the workout tracker work without an internet connection. The goal: open the app in the gym, log sets and meals, and have everything sync to Supabase automatically when connectivity returns.

---

## The core problem

Every component currently reads and writes directly to Supabase over the network. There is no local copy of the data. A failed network request means lost data or a broken UI.

The solution is a **two-layer architecture**:
- A local IndexedDB database lives on the device and is the source of truth for the UI
- Supabase becomes the sync target, not the primary data store
- Writes go to IndexedDB immediately, then queue for Supabase in the background

---

## Scope summary

| Phase | What it does | Complexity |
|---|---|---|
| 1 | PWA shell — app loads offline | Low |
| 2 | Local database schema | Low |
| 3 | Data access layer | Medium |
| 4 | Refactor components to use local DB | Medium |
| 5 | Sync engine | High |
| 6 | Initial data hydration | Medium |
| 7 | Conflict resolution | High |
| 8 | UI indicators | Low |

Phases 1–4 can be done incrementally with the app still functional at each step. Phases 5–7 are where the real complexity lives.

---

## Phase 1 — PWA shell

**What:** Make the app installable and load its static assets (JS, CSS, fonts) without a network request.

**Why first:** This is low-risk and gives you the app shell offline immediately. Data features come later.

### Steps

1. Install `vite-plugin-pwa`:
   ```
   npm install -D vite-plugin-pwa
   ```

2. Add to `vite.config.js`:
   ```js
   import { VitePWA } from 'vite-plugin-pwa'

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate',
         manifest: {
           name: 'Workout Tracker',
           short_name: 'Workout',
           theme_color: '#0a0a0a',
           background_color: '#0a0a0a',
           display: 'standalone',
           icons: [/* 192x192, 512x512 */],
         },
         workbox: {
           globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
         },
       }),
     ],
   })
   ```

3. Add a web app manifest icon set to `public/`.

### Result
- App installs to home screen on iOS/Android
- Blank shell loads with no connection
- Data pages still fail without network (fixed in later phases)

### Files touched
- `vite.config.js`
- `public/` (icons)

---

## Phase 2 — Local database schema

**What:** Set up IndexedDB on the device using [Dexie.js](https://dexie.org/), which wraps the raw IndexedDB API in a usable interface.

**Why Dexie:** Raw IndexedDB is callback-based and verbose. Dexie gives you promise-based queries that look similar to the Supabase SDK.

### Install

```
npm install dexie
```

### New file: `src/lib/localDb.js`

```js
import Dexie from 'dexie'

export const localDb = new Dexie('WorkoutTracker')

localDb.version(1).stores({
  // Mirror the Supabase schema. _synced: 0 = pending, 1 = synced
  workouts: 'id, user_id, day_number, workout_type, completed_at, notes, _synced',
  sets:     'id, workout_id, user_id, exercise_name, set_number, weight_lbs, reps, completed, _synced',
  meals:    'id, user_id, name, calories, protein, carbs, fats, notes, consumed_at, _synced',

  // Pending operations queue: one row per write that hasn't reached Supabase yet
  // operation: 'insert' | 'update' | 'delete'
  // table: 'workouts' | 'sets' | 'meals'
  // payload: JSON of the row or { id } for deletes
  pendingOps: '++localId, table, operation, recordId, createdAt',
})
```

### Key design decisions

- **UUIDs are generated on the client** (not by the DB). This is already the case — Supabase inserts with `uuid` primary keys work fine here.
- **`_synced` flag** marks whether a row has been confirmed written to Supabase.
- **`pendingOps` table** is the outbox — it accumulates writes when offline and is drained when back online.
- The local schema intentionally mirrors the Supabase schema so rows can be inserted/updated remotely without transformation.

### Files added
- `src/lib/localDb.js`

---

## Phase 3 — Data access layer

**What:** Create a set of functions that components call instead of using Supabase directly. These functions write to IndexedDB first and queue Supabase sync in the background.

**Why:** Components should not need to know whether they're online or offline. The data layer abstracts that.

### New file: `src/lib/data.js`

This module exports one function per operation. Example pattern:

```js
import { v4 as uuid } from 'uuid'
import { localDb } from './localDb'
import { supabase } from './supabase'

// Reads always come from local DB — fast, no network
export async function getWorkouts(userId) {
  return localDb.workouts
    .where('user_id').equals(userId)
    .reverse()
    .sortBy('completed_at')
}

// Writes go to local DB immediately, then queue for remote
export async function addWorkout(userId, fields) {
  const row = { id: uuid(), user_id: userId, ...fields, _synced: 0 }
  await localDb.workouts.add(row)
  await localDb.pendingOps.add({
    table: 'workouts',
    operation: 'insert',
    recordId: row.id,
    payload: row,
    createdAt: Date.now(),
  })
  return row
}

export async function updateSet(id, fields) {
  await localDb.sets.update(id, { ...fields, _synced: 0 })
  await localDb.pendingOps.add({
    table: 'sets',
    operation: 'update',
    recordId: id,
    payload: { id, ...fields },
    createdAt: Date.now(),
  })
}

export async function deleteWorkout(id) {
  await localDb.workouts.delete(id)
  await localDb.sets.where('workout_id').equals(id).delete()
  await localDb.pendingOps.add({
    table: 'workouts',
    operation: 'delete',
    recordId: id,
    payload: { id },
    createdAt: Date.now(),
  })
}
```

Full set of functions needed:

| Function | Tables touched |
|---|---|
| `getWorkouts(userId)` | workouts |
| `addWorkout(userId, fields)` | workouts + pendingOps |
| `updateWorkout(id, fields)` | workouts + pendingOps |
| `deleteWorkout(id)` | workouts, sets + pendingOps |
| `getSets(workoutId)` | sets |
| `addSet(fields)` | sets + pendingOps |
| `updateSet(id, fields)` | sets + pendingOps |
| `getMeals(userId)` | meals |
| `addMeal(userId, fields)` | meals + pendingOps |
| `deleteMeal(id)` | meals + pendingOps |

### Files added
- `src/lib/data.js`

---

## Phase 4 — Refactor components

**What:** Replace all `supabase.from(...).select/insert/update/delete` calls in components with calls to `src/lib/data.js`.

This is mechanical but it touches every data-fetching component. Work through them one at a time.

### Components to update

| Component | Current pattern | Change to |
|---|---|---|
| `CycleView` | `supabase.from('workouts').select(...)` | `getWorkouts(userId)` |
| `WorkoutView` | Multiple supabase calls for sets | `getSets`, `addSet`, `updateSet` |
| `HistoryView` | `supabase.from('workouts')...` | `getWorkouts`, `getSets` |
| `AnalyticsView` | `supabase.from('workouts')...` | `getWorkouts`, `getSets` |
| `MealView` | `supabase.from('meals')...` | `getMeals`, `addMeal`, `deleteMeal` |
| `MealHistory` | `supabase.from('meals')...` | `getMeals` |
| `NutritionAnalyticsView` | `supabase.from('meals')...` | `getMeals` |

### Pattern change in each component

Before:
```js
useEffect(() => {
  const { data } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
  setWorkouts(data)
}, [user.id])
```

After:
```js
useEffect(() => {
  getWorkouts(user.id).then(setWorkouts)
}, [user.id])
```

### At the end of this phase
- The app reads from and writes to IndexedDB
- Everything still works online because the sync engine (Phase 5) will flush the queue immediately when connected
- The app does **not** yet work fully offline (no data in local DB until Phase 6 hydrates it)

---

## Phase 5 — Sync engine

**What:** A background process that drains `pendingOps` to Supabase when the device is online.

This is the most complex piece. It runs:
- Once on app startup
- Whenever the browser fires `window.addEventListener('online', ...)`
- Optionally on a timer as a fallback (every 30–60 seconds)

### New file: `src/lib/sync.js`

```js
import { localDb } from './localDb'
import { supabase } from './supabase'

export async function syncPendingOps(userId) {
  if (!navigator.onLine) return

  const pending = await localDb.pendingOps.orderBy('createdAt').toArray()
  if (pending.length === 0) return

  for (const op of pending) {
    try {
      await applyOp(op, userId)
      await localDb.pendingOps.delete(op.localId)
      // Mark the local record as synced
      if (op.operation !== 'delete') {
        await localDb[op.table].update(op.recordId, { _synced: 1 })
      }
    } catch (err) {
      console.error('Sync failed for op', op, err)
      // Leave it in the queue for the next sync attempt
      break
    }
  }
}

async function applyOp(op, userId) {
  const { table, operation, payload } = op

  if (operation === 'insert') {
    const { error } = await supabase.from(table).upsert(payload)
    if (error) throw error
  }

  if (operation === 'update') {
    const { error } = await supabase.from(table).update(payload).eq('id', payload.id)
    if (error) throw error
  }

  if (operation === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', payload.id)
    if (error) throw error
  }
}
```

### Wire up in `App.jsx`

```js
useEffect(() => {
  if (!user) return
  syncPendingOps(user.id)

  const handleOnline = () => syncPendingOps(user.id)
  window.addEventListener('online', handleOnline)
  return () => window.removeEventListener('online', handleOnline)
}, [user])
```

### Important details

- **Operations must be applied in order.** You cannot update a row before the insert that created it lands in Supabase. The queue is drained sequentially, oldest-first.
- **Use `upsert` for inserts.** If the app syncs the same operation twice (e.g. after a crash), upsert is idempotent. Plain insert would fail with a duplicate key error.
- **On sync failure, stop and retry later.** Don't skip a failed operation and apply later ones — later operations may depend on the failed one (e.g. adding sets to a workout that hasn't synced yet).

### Files added
- `src/lib/sync.js`

### Files modified
- `src/App.jsx` (add sync call on login + online event)

---

## Phase 6 — Initial hydration

**What:** When a user logs in (or when local DB is empty), pull their data from Supabase into IndexedDB so the app has something to show offline.

### New file: `src/lib/hydrate.js`

```js
import { localDb } from './localDb'
import { supabase } from './supabase'

export async function hydrateFromRemote(userId) {
  // Only hydrate if local DB is empty for this user
  const existingCount = await localDb.workouts.where('user_id').equals(userId).count()
  if (existingCount > 0) return  // already hydrated

  const [{ data: workouts }, { data: meals }] = await Promise.all([
    supabase.from('workouts').select('*').eq('user_id', userId),
    supabase.from('meals').select('*').eq('user_id', userId),
  ])

  const workoutIds = (workouts ?? []).map(w => w.id)
  const { data: sets } = await supabase
    .from('sets')
    .select('*')
    .in('workout_id', workoutIds)

  // Bulk insert into local DB, mark all as synced
  await localDb.transaction('rw', localDb.workouts, localDb.sets, localDb.meals, async () => {
    await localDb.workouts.bulkPut((workouts ?? []).map(w => ({ ...w, _synced: 1 })))
    await localDb.sets.bulkPut((sets ?? []).map(s => ({ ...s, _synced: 1 })))
    await localDb.meals.bulkPut((meals ?? []).map(m => ({ ...m, _synced: 1 })))
  })
}
```

### Wire up in `App.jsx`

```js
useEffect(() => {
  if (!user) return
  hydrateFromRemote(user.id).then(() => syncPendingOps(user.id))
}, [user])
```

### Considerations

- Hydration only runs once (when the local DB is empty). After that, the local DB is kept up to date by the sync engine.
- If a user logs in on a new device, hydration pulls their full history down.
- For users with large datasets (years of logs), this initial pull could be slow. You could scope it to the last 90 days and load older data on demand.

### Files added
- `src/lib/hydrate.js`

---

## Phase 7 — Conflict resolution

**What:** Decide what happens when the same data exists in two states — a local pending write and a different version already in Supabase (e.g. edited on another device while offline).

This is the hardest problem in offline sync. The strategy below is deliberately simple.

### Strategy: last-write-wins by timestamp

Every write already records a timestamp (`completed_at` for workouts, `consumed_at` for meals). During sync, if a remote record has a newer timestamp than the local version, the remote version wins.

```js
// In applyOp, for updates:
const { data: remote } = await supabase
  .from(table)
  .select('completed_at')
  .eq('id', payload.id)
  .single()

if (remote && new Date(remote.completed_at) > new Date(payload.completed_at)) {
  // Remote is newer — skip local update, pull remote into local DB instead
  await localDb[table].put({ ...remote, _synced: 1 })
  return
}

// Otherwise proceed with the local update
```

### Delete conflicts

If a record was deleted locally but modified remotely: **local delete wins**. This is the simplest rule and avoids ghost data showing up after sync.

### Set-level conflicts

Sets within a workout are identified by `(exercise_name, set_number)`. If two devices log different weights for the same set, the one with the later sync timestamp wins. In practice this is rare — a single user on a single device logs a workout from start to finish.

### When to revisit this

Last-write-wins is fine for a single-user personal app. If you ever support shared workouts or multiple simultaneous devices editing the same session, you'd need operational transforms or CRDTs — a significant jump in complexity.

---

## Phase 8 — UI indicators

**What:** Show the user when they're offline and when data is pending sync.

### Online/offline banner

```jsx
// src/components/SyncStatus.jsx
import { useEffect, useState } from 'react'
import { localDb } from '../lib/localDb'

export default function SyncStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    localDb.pendingOps.count().then(setPending)
    // Re-check after any write
  }, [online])

  if (online && pending === 0) return null

  return (
    <div style={{ /* small banner below app header */ }}>
      {!online
        ? 'Offline — changes will sync when reconnected'
        : `Syncing ${pending} pending change${pending !== 1 ? 's' : ''}…`}
    </div>
  )
}
```

Mount this inside the app header in `App.jsx`.

### Files added
- `src/components/SyncStatus.jsx`

---

## Recommended implementation order

1. **Phase 2 + 3** — Set up local DB and data layer first, before touching components
2. **Phase 1** — PWA shell (independent, can be done any time)
3. **Phase 4** — Refactor one component at a time, test each before moving on
4. **Phase 6** — Hydration (needed before Phase 5 is useful)
5. **Phase 5** — Sync engine
6. **Phase 7** — Conflict handling (add on top of the working sync engine)
7. **Phase 8** — UI indicators (low effort, add last)

---

## New files summary

| File | Purpose |
|---|---|
| `src/lib/localDb.js` | Dexie IndexedDB schema and client |
| `src/lib/data.js` | Data access layer (replaces direct Supabase calls) |
| `src/lib/sync.js` | Drains pending ops queue to Supabase |
| `src/lib/hydrate.js` | Pulls remote data into local DB on first login |
| `src/components/SyncStatus.jsx` | Online/offline/pending indicator |

## Modified files summary

| File | Change |
|---|---|
| `vite.config.js` | Add vite-plugin-pwa |
| `src/App.jsx` | Wire up hydration, sync, and online listener |
| `src/components/CycleView.jsx` | Use data layer |
| `src/components/WorkoutView.jsx` | Use data layer |
| `src/components/HistoryView.jsx` | Use data layer |
| `src/components/AnalyticsView.jsx` | Use data layer |
| `src/components/MealView.jsx` | Use data layer |
| `src/components/MealHistory.jsx` | Use data layer |
| `src/components/NutritionAnalyticsView.jsx` | Use data layer |

## Dependencies to add

| Package | Why |
|---|---|
| `dexie` | IndexedDB wrapper |
| `vite-plugin-pwa` (dev) | Service worker and manifest generation |
