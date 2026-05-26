'use client'

import { useMemo, useState, useTransition } from 'react'
import { SetCard } from './set-card'
import { RestTimer } from './rest-timer'
import { SessionRecap } from './session-recap'
import { logSet, type LoggedSetRow } from './actions'
import {
  buildSetSequence,
  computeRestSeconds,
  suggestedWeight,
  type ProgramExerciseLike,
  type ProtectedParams,
  type SequenceStep,
} from './sequence'

type Props = {
  workoutSessionId: string
  programSessionName: string
  protectedParams: ProtectedParams
  programExercises: ProgramExerciseLike[]
  oneRmByExerciseId: Record<string, number>
  lastSetByExerciseId: Record<
    string,
    { weight_kg: number; reps: number; rpe: number | null; completed_at: string }
  >
  initialLoggedSets: LoggedSetRow[]
}

type RestState = {
  totalS: number
  startedAt: number
  nextLabel?: string
}

export function LiveWorkout(props: Props) {
  const [loggedSets, setLoggedSets] = useState<LoggedSetRow[]>(
    props.initialLoggedSets,
  )
  const [restState, setRestState] = useState<RestState | null>(null)
  const [pending, startTransition] = useTransition()
  const [workoutStartedAt] = useState(
    () => props.initialLoggedSets[0]?.completed_at ?? new Date().toISOString(),
  )

  const sequence = useMemo(
    () => buildSetSequence(props.programExercises),
    [props.programExercises],
  )

  // Position courante = premier step de la séquence sans set loggé correspondant
  const completedKeys = useMemo(() => {
    const s = new Set<string>()
    for (const ls of loggedSets) {
      if (ls.program_exercise_id) {
        s.add(`${ls.program_exercise_id}-${ls.set_index}`)
      }
    }
    return s
  }, [loggedSets])

  const currentStepIndex = useMemo(() => {
    return sequence.findIndex(
      (st) => !completedKeys.has(`${st.programExerciseId}-${st.setIndex}`),
    )
  }, [sequence, completedKeys])

  if (currentStepIndex === -1) {
    return (
      <SessionRecap
        workoutSessionId={props.workoutSessionId}
        workoutStartedAt={workoutStartedAt}
        programSessionName={props.programSessionName}
        programExercises={props.programExercises}
        loggedSets={loggedSets}
      />
    )
  }

  const currentStep = sequence[currentStepIndex]
  const exo = props.programExercises.find(
    (pe) => pe.id === currentStep.programExerciseId,
  )!
  const prescribed = exo.prescribed_sets.find(
    (ps) => ps.set_index === currentStep.setIndex,
  )!
  const suggested = suggestedWeight(
    props.oneRmByExerciseId[exo.exercise_id],
    prescribed.target_pct_of_working,
    exo.exercises.category === 'compound',
  )
  const lastSet = props.lastSetByExerciseId[exo.exercise_id] ?? null

  const nextStep = sequence[currentStepIndex + 1]
  const nextLabel = nextStep
    ? (() => {
        const nextExo = props.programExercises.find(
          (pe) => pe.id === nextStep.programExerciseId,
        )
        return nextExo
          ? `${nextExo.exercises.name} · set ${nextStep.setIndex}/${nextExo.target_sets}`
          : undefined
      })()
    : 'Fin de séance'

  function handleValidate(data: {
    weightKg: number
    reps: number
    rpe: number | null
  }) {
    const restSeconds = computeRestSeconds(exo, currentStep, props.protectedParams)
    startTransition(async () => {
      try {
        const inserted = await logSet({
          workoutSessionId: props.workoutSessionId,
          programExerciseId: exo.id,
          prescribedSetId: prescribed.id,
          exerciseId: exo.exercise_id,
          setIndex: currentStep.setIndex,
          weightKg: data.weightKg,
          reps: data.reps,
          rpe: data.rpe,
        })
        // Convertir les numerics retournés par Postgres (string) en number
        const normalized: LoggedSetRow = {
          ...inserted,
          weight_kg: Number(inserted.weight_kg),
          rpe: inserted.rpe != null ? Number(inserted.rpe) : null,
        }
        setLoggedSets((prev) => [...prev, normalized])
        setRestState({
          totalS: restSeconds,
          startedAt: Date.now(),
          nextLabel,
        })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        alert(`Erreur log set : ${msg}`)
      }
    })
  }

  // Stats discrètes en haut
  const totalSets = sequence.length
  const doneSets = loggedSets.length

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between text-xs text-neutral-500">
        <span>{props.programSessionName}</span>
        <span>
          {doneSets}/{totalSets} sets
        </span>
      </header>

      <SetCard
        exercise={exo}
        prescribedSet={prescribed}
        step={currentStep}
        suggestedWeightKg={suggested}
        lastSet={lastSet}
        pending={pending}
        onValidate={handleValidate}
      />

      {restState && (
        <RestTimer
          totalSeconds={restState.totalS}
          nextLabel={restState.nextLabel}
          onComplete={() => setRestState(null)}
          onSkip={() => setRestState(null)}
        />
      )}
    </div>
  )
}
