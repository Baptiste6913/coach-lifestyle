import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

  // Get latest program (active by convention = highest version)
  const { data: program } = await supabase
    .from('programs')
    .select('id, name, version')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Workout</h1>
        <p className="text-sm text-neutral-500">
          Aucun programme en DB. Lance{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-900">
            npx tsx scripts/seed-program-v7.ts
          </code>{' '}
          d&apos;abord.
        </p>
      </div>
    )
  }

  const { data: sessions } = await supabase
    .from('program_sessions')
    .select('id, name, day_of_week, order_index, target_sets_total')
    .eq('program_id', program.id)
    .order('order_index')

  // Détection d'une séance in_progress (reprise possible)
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
        <h1 className="text-xl font-semibold">{program.name}</h1>
        <p className="text-sm text-neutral-500">
          version {program.version} · {sessions?.length ?? 0} séances
        </p>
      </header>

      {sp.error && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {sp.error}
        </p>
      )}

      {inProgress && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Séance en cours : {inProgress.program_sessions.name}
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
            Démarrée le{' '}
            {new Date(inProgress.started_at).toLocaleString('fr-FR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
          <div className="mt-2 flex gap-2">
            <form action={resumeWorkoutSession}>
              <input type="hidden" name="workout_session_id" value={inProgress.id} />
              <button
                type="submit"
                className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-amber-50 hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-300"
              >
                Reprendre
              </button>
            </form>
            <form action={abandonWorkoutSession}>
              <input type="hidden" name="workout_session_id" value={inProgress.id} />
              <button
                type="submit"
                className="rounded-md border border-amber-700 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-400 dark:text-amber-200 dark:hover:bg-amber-900"
              >
                Abandonner
              </button>
            </form>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {(sessions ?? []).map((session) => (
          <li
            key={session.id}
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{session.name}</div>
                <div className="text-xs text-neutral-500">
                  {DAY_NAMES[session.day_of_week]}
                  {session.target_sets_total
                    ? ` · ${session.target_sets_total} working sets`
                    : ''}
                </div>
              </div>
              <form action={startWorkoutSession}>
                <input
                  type="hidden"
                  name="program_session_id"
                  value={session.id}
                />
                <button
                  type="submit"
                  disabled={!!inProgress}
                  className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                >
                  Commencer
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <footer className="flex gap-3 pt-2 text-xs text-neutral-500">
        <Link href="/setup/one-rep-maxes" className="underline">
          Mes 1RM
        </Link>
        <Link href="/dashboard" className="underline">
          Dashboard
        </Link>
      </footer>
    </div>
  )
}
