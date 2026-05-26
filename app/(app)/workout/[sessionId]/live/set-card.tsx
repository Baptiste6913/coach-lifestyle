'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ProgramExerciseLike, SequenceStep } from './sequence'
import { weightStep } from './sequence'

type Props = {
  exercise: ProgramExerciseLike
  prescribedSet: ProgramExerciseLike['prescribed_sets'][number]
  step: SequenceStep
  suggestedWeightKg: number | null
  lastSet: {
    weight_kg: number
    reps: number
    rpe: number | null
    completed_at: string
  } | null
  pending: boolean
  onValidate: (data: {
    weightKg: number
    reps: number
    rpe: number | null
  }) => void
}

const RPE_VALUES = [5, 6, 7, 8, 9, 10]

export function SetCard(props: Props) {
  const isCompound = props.exercise.exercises.category === 'compound'
  const wStep = weightStep(isCompound)
  const defaultReps = Math.round(
    (props.prescribedSet.target_reps_low + props.prescribedSet.target_reps_high) /
      2,
  )

  // Reset des states quand on change de set (set_index ou exercise change)
  const setKey = `${props.exercise.id}-${props.prescribedSet.set_index}`
  const [weight, setWeight] = useState<number | ''>('')
  const [reps, setReps] = useState<number | ''>('')
  const [rpe, setRpe] = useState<number | null>(null)

  useEffect(() => {
    setWeight(props.suggestedWeightKg ?? '')
    setReps(defaultReps)
    setRpe(props.prescribedSet.rpe_target ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setKey])

  const targetPctDisplay = useMemo(() => {
    const pct = Math.round(props.prescribedSet.target_pct_of_working * 100)
    return pct === 100 ? null : pct
  }, [props.prescribedSet.target_pct_of_working])

  const canSubmit =
    typeof weight === 'number' &&
    weight >= 0 &&
    typeof reps === 'number' &&
    reps > 0

  function submit() {
    if (!canSubmit) return
    props.onValidate({
      weightKg: Number(weight),
      reps: Number(reps),
      rpe: rpe,
    })
  }

  const exo = props.exercise

  return (
    <div className="space-y-4">
      {/* Superset header */}
      {props.step.superset && (
        <div className="rounded-md bg-blue-100 px-3 py-2 text-xs font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
          Superset {props.step.superset.group} — exo{' '}
          {props.step.superset.position}/2 · tour {props.step.superset.round}/
          {props.step.superset.totalRounds}
        </div>
      )}

      {/* Exercise header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold leading-tight">
          {exo.exercises.name}
        </h1>
        <div className="text-sm text-neutral-500">
          Set {props.prescribedSet.set_index}/{exo.target_sets}
          {targetPctDisplay !== null && (
            <>
              {' · '}
              <span className="font-medium">@ {targetPctDisplay} % du 1RM</span>
            </>
          )}
          {props.prescribedSet.is_warmup && (
            <span className="ml-2 inline-block rounded bg-orange-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-orange-900 dark:bg-orange-900 dark:text-orange-200">
              Warmup
            </span>
          )}
        </div>
        <div className="text-xs text-neutral-500">
          Cible : {props.prescribedSet.target_reps_low}–
          {props.prescribedSet.target_reps_high} reps
          {props.prescribedSet.rpe_target != null && (
            <> · RPE {props.prescribedSet.rpe_target}</>
          )}
        </div>
        {exo.warmup_protocol && (
          <div className="text-xs italic text-neutral-500">
            Échauffement : {exo.warmup_protocol}
          </div>
        )}
        {exo.execution_cues && (
          <div className="text-xs italic text-neutral-500">
            ▸ {exo.execution_cues}
          </div>
        )}
        {props.lastSet && (
          <div className="text-xs text-neutral-500">
            Dernière fois :{' '}
            <span className="font-mono">
              {props.lastSet.weight_kg} × {props.lastSet.reps}
              {props.lastSet.rpe != null && ` @${props.lastSet.rpe}`}
            </span>
            {' · '}
            {new Date(props.lastSet.completed_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </div>
        )}
      </header>

      {/* Weight + Reps inputs */}
      <div className="grid grid-cols-2 gap-3">
        <NumericInput
          label="Poids (kg)"
          value={weight}
          onChange={setWeight}
          step={wStep}
          min={0}
          max={500}
        />
        <NumericInput
          label="Reps"
          value={reps}
          onChange={setReps}
          step={1}
          min={0}
          max={50}
        />
      </div>

      {/* RPE */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">RPE (optionnel)</label>
        <div className="grid grid-cols-6 gap-1.5">
          {RPE_VALUES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setRpe(rpe === v ? null : v)}
              className={
                'rounded-md border py-2 text-sm font-medium transition ' +
                (rpe === v
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                  : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900')
              }
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Validate */}
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit || props.pending}
        className="min-h-[60px] w-full rounded-md bg-green-700 px-4 text-base font-semibold text-white transition hover:bg-green-800 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500"
      >
        {props.pending ? 'Enregistrement…' : 'Valider le set'}
      </button>
    </div>
  )
}

function NumericInput({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string
  value: number | ''
  onChange: (v: number | '') => void
  step: number
  min: number
  max: number
}) {
  function bump(delta: number) {
    const current = typeof value === 'number' ? value : 0
    const next = Math.max(min, Math.min(max, current + delta))
    onChange(Number(next.toFixed(2)))
  }
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-[auto_1fr_auto] gap-1">
        <button
          type="button"
          onClick={() => bump(-step)}
          className="min-h-[48px] min-w-[44px] rounded-md border border-neutral-300 bg-white text-lg font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-900"
          aria-label={`-${step}`}
        >
          −
        </button>
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const raw = e.target.value
            onChange(raw === '' ? '' : Number(raw))
          }}
          className="min-h-[48px] rounded-md border border-neutral-300 bg-white px-2 text-center text-lg font-mono focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-100"
        />
        <button
          type="button"
          onClick={() => bump(step)}
          className="min-h-[48px] min-w-[44px] rounded-md border border-neutral-300 bg-white text-lg font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-neutral-900"
          aria-label={`+${step}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
