# coach-lifestyle

A Next.js and Supabase app that runs a four-day strength program as a live workout screen, with per-set logging, supersets, a rest timer, and a session recap.

## Run

Requires a Supabase project.

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

Apply the three SQL files in `supabase/migrations/` in filename order, then sign in once through the app so an auth user exists. Seed the program. The script refuses to run outside a local environment.

```bash
npx tsx scripts/seed-program-v7.ts
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`. The repo has no test suite.

## Architecture

- `data/program-v7.json` holds the program. Zod schemas in `data/program-v7.types.ts` validate it and enforce superset rules (each group has exactly two exercises, positions 1 and 2).
- `scripts/seed-program-v7.ts` validates first, then upserts programs, sessions, exercises, and prescribed sets. Pyramidal exercises expand to three sets at 70, 85, and 100 percent of the working weight.
- `supabase/migrations/` defines 8 tables with row-level security. The exercise table is a public reference table. Every other table is scoped to its owner.
- `proxy.ts` calls `lib/supabase/middleware.ts` on each request to refresh the Supabase session cookies. Login uses a magic link (`app/(auth)/login`, `app/auth/callback`).
- `app/(app)/setup/one-rep-maxes` stores 1RM values. `app/(app)/workout` opens a new session or resumes the current one.
- `app/(app)/workout/[sessionId]/live` runs the session. `sequence.ts` orders the sets and interleaves superset rounds. It also computes suggested weights from the 1RM. Server actions write each logged set.

## Stack

Next.js 16 (App Router, server actions), React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, `@supabase/ssr`), Zod 4, TanStack Query, lucide-react, ESLint.

## Status

Phase 1 is in progress. Auth, program seed, 1RM entry, and the live workout flow are in place. The dashboard is a stub: the six-stat radar is not built. The `lib/coach`, `lib/gamification`, `lib/vision`, and `lib/workout-engine` directories hold only placeholder files.
