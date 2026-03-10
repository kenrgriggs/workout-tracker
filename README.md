# Workout Tracker

A personal workout tracker for a 9-day rotating training cycle. Built with React + Vite, Supabase (auth + database), Tailwind CSS, and deployed to Azure Static Web Apps.

## Features

- 9-day cycle: Push A → Zone 2 → Pull A → VO2 → Rest → Push B → Pull B → Legs → Rest
- Log sets with weight and reps per exercise
- See last session's numbers as a reference while logging
- Session history with full set breakdowns
- Dark theme, mobile-first design

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account and project
- An [Azure Static Web Apps](https://azure.microsoft.com/products/app-service/static) resource (for deployment)

---

## Local Development

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/workout-tracker.git
cd workout-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

> Find these in your Supabase project settings under **Project Settings → API**.

### 4. Set up the database

Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) and run:

```
supabase/migrations/001_initial_schema.sql
```

Then run the SQL in `supabase/migrations/002_add_meals_table.sql` (copy & paste the file contents into the Supabase SQL editor and execute it).

If you have the Supabase CLI installed, you can also run:

```bash
supabase db push --file supabase/migrations/002_add_meals_table.sql
```

This creates the `workouts`, `sets`, and new `meals` table (with RLS policies) so each user only sees their own data.

> If the app says it can’t find `public.meals`, it means the migration wasn’t applied in your Supabase project. Make sure you actually **run the SQL**, not just type the filename, then refresh the app.

### 5. Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## Deployment — Azure Static Web Apps

### One-time Azure setup

1. Create a **Static Web App** resource in the Azure Portal.
2. When prompted, choose **Custom** deployment — you'll wire up GitHub manually.
3. Copy the **Deployment Token** from the Azure portal.

### GitHub secrets

In your GitHub repo, go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from Azure |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key |

### Custom domain

In the Azure portal, navigate to your Static Web App → **Custom domains** and add `workout-tracker.zlorpcorp.com`. Follow the DNS validation steps.

### Deploy

Push to `main` — the GitHub Actions workflow in `.github/workflows/azure-static-web-apps.yml` will build and deploy automatically.

---

## Project Structure

```
workout-tracker/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml   # CI/CD pipeline
├── src/
│   ├── components/
│   │   ├── LoginPage.jsx               # Auth screen
│   │   ├── CycleView.jsx               # 9-day cycle timeline
│   │   ├── WorkoutView.jsx             # Active workout logging
│   │   ├── HistoryView.jsx             # Past session history
│   │   └── BottomNav.jsx               # Tab navigation
│   ├── contexts/
│   │   └── AuthContext.jsx             # Supabase auth state
│   ├── lib/
│   │   ├── supabase.js                 # Supabase client
│   │   └── workoutDefinitions.js       # Hardcoded 9-day cycle
│   ├── App.jsx                         # Root component + routing
│   ├── main.jsx                        # Entry point
│   └── index.css                       # Tailwind + base styles
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # DB schema + RLS policies
├── staticwebapp.config.json            # Azure SWA config (SPA routing)
├── .env.example                        # Environment variable template
└── vite.config.js
```

---

## Database Schema

### `workouts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | References `auth.users` |
| day_number | int | 1–9 |
| workout_type | text | e.g. "Push A" |
| completed_at | timestamptz | Session timestamp |
| notes | text | Optional |

### `sets`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| workout_id | uuid | References `workouts` |
| user_id | uuid | References `auth.users` |
| exercise_name | text | |
| set_number | int | |
| weight_lbs | numeric | Nullable |
| reps | int | Nullable |
| completed | boolean | Default false |
