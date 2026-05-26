'use client'

import { useTransition } from 'react'
import { finishSession } from './actions'
import type { ProgramExerciseLike } from './sequence'
import type { LoggedSetRow } from './actions'

type Props = {
  workoutSessionId: string
  workoutStartedAt: string
  programSessionName: string
  programExercises: ProgramExerciseLike[]
  loggedSets: LoggedSetRow[]
}

export function SessionRecap(props: Props) {
  const [pending, startTransition] = useTransition()

  const workingSets = props.loggedSets.filter((s) => {
    const pe = props.programExercises.find((p) => p.id === s.program_exercise_id)
    const ps = pe?.prescribed_sets.find((p) => p.set_index === s.set_index)
    return ps ? !ps.is_warmup : true
  })

  const totalVolume = workingSets.reduce(
    (acc, s) => acc + s.weight_kg * s.reps,
    0,
  )
  const rpeWithValue = workingSets.filter((s) => s.rpe != null)
  const avgRpe =
    rpeWithValue.length > 0
      ? rpeWithValue.reduce((a, s) => a + (s.rpe ?? 0), 0) / rpeWithValue.length
      : null

  const durationMin = Math.round(
    (Date.now() - new Date(props.workoutStartedAt).getTime()) / 60000,
  )

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-green-700 dark:text-green-400">
          Séance terminée
        </div>
        <h1 className="text-2xl font-semibold">{props.programSessionName}</h1>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Durée"
          value={`${durationMin} min`}
        />
        <Stat
          label="Volume"
          value={`${Math.round(totalVolume).toLocaleString('fr-FR')} kg`}
          sub="working sets"
        />
        <Stat
          label="RPE moyen"
          value={avgRpe != null ? avgRpe.toFixed(1) : '—'}
          sub="working sets"
        />
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-1.5 font-medium">Sets loggés</div>
        <ul className="space-y-0.5 font-mono text-neutral-600 dark:text-neutral-400">
          {props.loggedSets.map((s) => {
            const pe = props.programExercises.find(
              (p) => p.id === s.program_exercise_id,
            )
            return (
              <li key={s.id}>
                {pe?.exercises.name ?? '?'} · set {s.set_index} · {s.weight_kg} ×{' '}
                {s.reps}
                {s.rpe != null && ` @${s.rpe}`}
              </li>
            )
          })}
        </ul>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => finishSession(props.workoutSessionId))
        }
        className="min-h-[60px] w-full rounded-md bg-green-700 px-4 text-base font-semibold text-white transition hover:bg-green-800 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500"
      >
        {pending ? 'Enregistrement…' : 'Terminer la séance'}
      </button>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3 text-center dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
      {sub && <div className="text-[10px] text-neutral-500">{sub}</div>}
    </div>
  )
}
