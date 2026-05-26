'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
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
    (props.prescribedSet.target_reps_low +
      props.prescribedSet.target_reps_high) /
      2,
  )

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
    <div className="space-y-5">
      {props.step.superset && (
        <div className="rounded-md border border-neutral-200 bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Superset {props.step.superset.group} — exo{' '}
          <span className="font-mono tabular-nums">
            {props.step.superset.position}/2
          </span>{' '}
          · tour{' '}
          <span className="font-mono tabular-nums">
            {props.step.superset.round}/{props.step.superset.totalRounds}
          </span>
        </div>
      )}

      <header className="space-y-1.5">
        <h1 className="text-xl font-semibold leading-tight tracking-tight">
          {exo.exercises.name}
        </h1>
        <div className="text-sm text-neutral-500">
          Set{' '}
          <span className="font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
            {props.prescribedSet.set_index}/{exo.target_sets}
          </span>
          {targetPctDisplay !== null && (
            <>
              {' · '}
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                @ <span className="font-mono tabular-nums">{targetPctDisplay}</span>{' '}
                % du 1RM
              </span>
            </>
          )}
          {props.prescribedSet.is_warmup && (
            <span className="ml-2 inline-block rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Warmup
            </span>
          )}
        </div>
        <div className="text-xs text-neutral-500">
          Cible :{' '}
          <span className="font-mono tabular-nums">
            {props.prescribedSet.target_reps_low}–
            {props.prescribedSet.target_reps_high}
          </span>{' '}
          reps
          {props.prescribedSet.rpe_target != null && (
            <>
              {' · RPE '}
              <span className="font-mono tabular-nums">
                {props.prescribedSet.rpe_target}
              </span>
            </>
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
            <span className="font-mono tabular-nums">
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

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          RPE (optionnel)
        </label>
        <div className="grid grid-cols-6 gap-1.5">
          {RPE_VALUES.map((v) => {
            const selected = rpe === v
            return (
              <button
                key={v}
                type="button"
                onClick={() => setRpe(selected ? null : v)}
                className={
                  'min-h-12 rounded-md border font-mono text-sm font-medium tabular-nums transition-colors ' +
                  (selected
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800')
                }
              >
                {v}
              </button>
            )
          })}
        </div>
      </div>

      <Button
        type="button"
        variant="success"
        size="lg"
        onClick={submit}
        disabled={!canSubmit || props.pending}
        className="w-full"
      >
        {props.pending ? 'Enregistrement…' : 'Valider le set'}
      </Button>
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
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </label>
      <div className="grid grid-cols-[auto_1fr_auto] gap-1">
        <button
          type="button"
          onClick={() => bump(-step)}
          className="min-h-12 min-w-12 rounded-md border border-neutral-300 bg-white text-lg font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
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
          className="min-h-12 rounded-md border border-neutral-300 bg-white px-2 text-center font-mono text-xl tabular-nums focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="button"
          onClick={() => bump(step)}
          className="min-h-12 min-w-12 rounded-md border border-neutral-300 bg-white text-lg font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          aria-label={`+${step}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
