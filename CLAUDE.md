# Claude Code Guide — Workout Tracker

A personal workout and nutrition tracker built on React + Supabase. Users follow a repeating 9-day Push/Pull/Legs + cardio cycle, log sets and weights, track meals, and review performance over time. All data is scoped to the authenticated user via Supabase RLS.

---

## Read these first

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — stack, directory structure, database schema, state management, routing, data flow, design system, and all key architectural decisions. Always read this before writing code.
- **[ChangeTypeWorkflows.md](ChangeTypeWorkflows.md)** — the exact workflow to follow for every type of change (new feature, bug fix, refactor, migration, etc.). Always follow the workflow that matches what you're doing.

---

## Running tests

```bash
npm run dev        # start local dev server
npx vitest run     # run all tests once
npx vitest         # watch mode
```

Tests live alongside their components (`WorkoutView.test.jsx` next to `WorkoutView.jsx`). All Supabase calls are mocked — tests never hit the network.

---

## Claude Code-specific instructions

- **Always read ARCHITECTURE.md before writing code**, even for small changes. It captures decisions that are not obvious from reading the code alone.
- **Always follow the matching workflow in ChangeTypeWorkflows.md.** Identify the change type first, then follow the steps in order.
- **Do not update both CLAUDE.md and ARCHITECTURE.md for the same thing.** If something about the app's structure or design changes, update ARCHITECTURE.md only. CLAUDE.md is an index, not a copy.
- **Do not modify tests to match broken code.** Fix the code to match the tests.
