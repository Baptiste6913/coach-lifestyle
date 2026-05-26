import Link from 'next/link'
import { Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  startWorkoutSession,
  resumeWorkoutSession,
  abandonWorkoutSession,
} from './actions'

export const metadata = { title: 'Workout — coach-lifestyle' }

const DAY_NAMES: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
  6: 'Samedi',
  7: 'Dimanche',
}

export default async function WorkoutIndex({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: program } = await supabase
    .from('programs')
    .select('id, name, version')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Workout</h1>
        <Card>
          <p className="text-sm text-neutral-500">
            Aucun programme en DB. Lance{' '}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
              npx tsx scripts/seed-program-v7.ts
            </code>{' '}
            d&apos;abord.
          </p>
        </Card>
      </div>
    )
  }

  const { data: sessions } = await supabase
    .from('program_sessions')
    .select('id, name, day_of_week, order_index, target_sets_total')
    .eq('program_id', program.id)
    .order('order_index')

  const { data: inProgress } = await supabase
    .from('workout_sessions')
    .select(
      'id, started_at, program_sessions!inner(id, name, day_of_week)',
    )
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{program.name}</h1>
        <p className="text-sm text-neutral-500">
          <span className="font-mono tabular-nums">
            v{program.version}
          </span>{' '}
          ·{' '}
          <span className="font-mono tabular-nums">
            {sessions?.length ?? 0}
          </span>{' '}
          séances
        </p>
      </header>

      {sp.error && (
        <p
          role="alert"
          className="flex min-h-12 items-center rounded-lg border border-red-300 bg-red-50 px-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {sp.error}
        </p>
      )}

      {inProgress && (
        <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Séance en cours : {inProgress.program_sessions.name}
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
            Démarrée le{' '}
            <span className="font-mono tabular-nums">
              {new Date(inProgress.started_at).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <form action={resumeWorkoutSession}>
              <input
                type="hidden"
                name="workout_session_id"
                value={inProgress.id}
              />
              <Button type="submit" variant="accent" size="sm">
                Reprendre
              </Button>
            </form>
            <form action={abandonWorkoutSession}>
              <input
                type="hidden"
                name="workout_session_id"
                value={inProgress.id}
              />
              <Button type="submit" variant="ghost" size="sm">
                Abandonner
              </Button>
            </form>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {(sessions ?? []).map((session) => (
          <li key={session.id}>
            <Card className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{session.name}</div>
                <div className="text-xs text-neutral-500">
                  {DAY_NAMES[session.day_of_week]}
                  {session.target_sets_total ? (
                    <>
                      {' · '}
                      <span className="font-mono tabular-nums">
                        {session.target_sets_total}
                      </span>{' '}
                      working sets
                    </>
                  ) : null}
                </div>
              </div>
              <form action={startWorkoutSession}>
                <input
                  type="hidden"
                  name="program_session_id"
                  value={session.id}
                />
                <Button
                  type="submit"
                  variant="accent"
                  size="md"
                  disabled={!!inProgress}
                >
                  <Play size={14} aria-hidden="true" />
                  Commencer
                </Button>
              </form>
            </Card>
          </li>
        ))}
      </ul>

      <footer className="flex gap-4 pt-2 text-xs">
        <Link
          href="/setup/one-rep-maxes"
          className="text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Mes 1RM
        </Link>
        <Link
          href="/dashboard"
          className="text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Dashboard
        </Link>
      </footer>
    </div>
  )
}
