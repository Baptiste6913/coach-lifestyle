'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Stat } from '@/components/ui/stat'
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
    const pe = props.programExercises.find(
      (p) => p.id === s.program_exercise_id,
    )
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
        <div className="text-xs uppercase tracking-wider text-green-600 dark:text-green-500">
          Séance terminée
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {props.programSessionName}
        </h1>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Durée" value={`${durationMin} min`} mono />
        <Stat
          label="Volume"
          value={`${Math.round(totalVolume).toLocaleString('fr-FR')} kg`}
          sub="working sets"
          mono
        />
        <Stat
          label="RPE moyen"
          value={avgRpe != null ? avgRpe.toFixed(1) : '—'}
          sub="working sets"
          mono
        />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-xs dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-2 font-medium">Sets loggés</div>
        <ul className="space-y-0.5 font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
          {props.loggedSets.map((s) => {
            const pe = props.programExercises.find(
              (p) => p.id === s.program_exercise_id,
            )
            return (
              <li key={s.id}>
                {pe?.exercises.name ?? '?'} · set {s.set_index} · {s.weight_kg}{' '}
                × {s.reps}
                {s.rpe != null && ` @${s.rpe}`}
              </li>
            )
          })}
        </ul>
      </div>

      <Button
        type="button"
        variant="success"
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(() => finishSession(props.workoutSessionId))
        }
        className="w-full"
      >
        {pending ? 'Enregistrement…' : 'Terminer la séance'}
      </Button>
    </div>
  )
}
