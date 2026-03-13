# Change Type Workflows

This document defines the change types used in this codebase and the exact workflow Claude Code should follow for each. The goal is consistent, verifiable, and well-documented changes regardless of who or what is making them.

---

## Change Types

1. [New Feature](#new-feature)
2. [Bug Fix](#bug-fix)
3. [Refactor](#refactor)
4. [Performance Optimization](#performance-optimization)
5. [Dependency Upgrade](#dependency-upgrade)
6. [Data Migration](#data-migration)
7. [Config / Infrastructure Change](#config--infrastructure-change)
8. [Code Documentation](#code-documentation)

---

## New Feature

Adding behavior that does not exist yet.

**Workflow:**

1. Read ARCHITECTURE.md and any relevant source files before writing any code.
2. Write failing tests that define the expected behavior (happy path, empty state, error state).
3. Confirm the tests fail before implementing anything.
4. Implement the feature until all tests pass.
5. Do not modify tests to match broken code — fix the code to match the tests.
6. Add comments explaining non-obvious decisions.
7. Update ARCHITECTURE.md if the feature changes data flow, state management, or directory structure.
8. Update README.md if the feature changes setup, environment variables, or user-facing behavior.

---

## Bug Fix

Correcting behavior that exists but is wrong.

**Workflow:**

1. Read the relevant source files and understand the current (broken) behavior before touching anything.
2. Write a failing test that reproduces the bug. If the bug can't be reproduced by a test, document why.
3. Confirm the test fails before making any fix.
4. Fix the code until the test passes.
5. Run the full test suite to confirm nothing else regressed.
6. Do not modify tests to match broken code — fix the code to match the tests.
7. Add a comment at the fix site if the cause was non-obvious.
8. Update ARCHITECTURE.md only if the bug revealed a structural misunderstanding worth documenting.

---

## Refactor

Reorganizing or restructuring code without changing behavior.

**Workflow:**

1. Read ARCHITECTURE.md and all files that will be touched before writing any code.
2. Write tests that lock in the *current* behavior of the code being refactored. Run them and confirm they pass before changing anything.
3. Make the structural change.
4. Run the tests again. They should still pass. If they fail, the refactor broke something — fix the code, not the tests.
5. Repeat until clean.
6. Add comments if the new structure benefits from explanation.
7. Update ARCHITECTURE.md to reflect the new structure (file locations, data flow, patterns).
8. Do not update README.md unless the refactor changes something user-facing or changes the dev setup.

---

## Performance Optimization

Improving speed, memory usage, or efficiency without changing behavior.

**Workflow:**

1. Establish a baseline before touching anything. Document what is slow and why (profiler output, render counts, query times).
2. Write or confirm existing tests cover the behavior being optimized. These must pass before and after.
3. Make the optimization.
4. Run the full test suite to confirm behavior is unchanged.
5. Verify the optimization actually improved the baseline metric. Do not ship a "performance fix" that has no measurable effect.
6. Add a comment at the optimization site explaining what was slow and what was done about it.
7. Update ARCHITECTURE.md if the optimization changes a pattern used elsewhere (e.g. memoization strategy, query shape).

---

## Dependency Upgrade

Updating a package to a newer version.

**Workflow:**

1. Check the package changelog or release notes for breaking changes before upgrading.
2. Upgrade the package.
3. Run the full test suite. The existing tests are the primary feedback mechanism here — no new tests needed.
4. Fix any failures caused by the upgrade. Do not suppress or delete failing tests.
5. Manually verify any behavior that tests do not cover (especially UI rendering or auth flows).
6. Update ARCHITECTURE.md if the version change is significant enough to affect documented patterns (e.g. a major Supabase or React version bump).

---

## Data Migration

Changing the shape or content of data in the database.

**Workflow:**

1. Write the migration SQL in `supabase/migrations/` following the existing naming convention.
2. Test the migration against a local or staging database first. Never run an untested migration against production.
3. Verify the output manually after the dry run — confirm row counts, column values, and RLS behavior are correct.
4. Apply to production.
5. Confirm the app behaves correctly against the migrated data.
6. Update ARCHITECTURE.md to reflect schema changes (tables, columns, relationships, indexes).
7. Unit tests are generally not applicable here. Do not write application tests to validate migration SQL.

---

## Config / Infrastructure Change

Modifying environment variables, build config, deployment settings, or CI/CD pipelines.

**Workflow:**

1. Document what is being changed and why before making any change.
2. Make the change in the non-production environment first (local or staging).
3. Verify the build and deployment succeed end-to-end.
4. Apply to production.
5. Confirm the deployed app behaves correctly after the change.
6. Unit tests do not apply here. Verification is manual and deployment-driven.
7. Update ARCHITECTURE.md if the change affects environment variables, build output, or hosting configuration.
8. Update README.md if the change affects local dev setup (new env vars, changed commands, etc.).

---

## Code Documentation

Adding or improving comments across the codebase. No behavior changes — this is purely about making intent legible to future readers and to AI models operating without full context.

**The core rule: comments explain *why*, not *what*. If the code already says what it does, the comment adds nothing. The comment should explain intent, constraints, or non-obvious decisions that the code itself cannot express.**

Examples:
- Bad: `// fetch meals on mount`
- Good: `// refetch after insert so the list reflects the new row without a full page reload`

**Workflow:**

1. Read ARCHITECTURE.md before touching anything to understand the overall structure and intent.
2. Work file by file. Read each file fully before writing any comments for it.
3. Add comments that explain why, not what. Restate nothing the code already says clearly.
4. Do not change any code while doing this. If you spot something worth fixing, note it in a list and move on. Do not mix documentation with fixes — they should be separate changes.
5. Run the full test suite after completing each file. Comments should never affect behavior, but a stray edit can — catch it immediately.
6. Do not update ARCHITECTURE.md or README.md. If you find something outright missing or wrong in them, notify me in your response.  
