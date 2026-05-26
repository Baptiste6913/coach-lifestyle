// Helpers de séquencement et calcul de poids pour la live session.
// Pure functions, testables unitairement.

export type ProtectedParams = {
  pyramidal_pct: [number, number, number]
  rest_compound_s: number
  rest_isolation_s: number
  rest_superset_intra_s: number
  rest_superset_inter_s: number
}

export type ProgramExerciseLike = {
  id: string
  exercise_id: string
  order_index: number
  is_pyramidal: boolean
  superset_group: 'A' | 'B' | null
  superset_position: number | null
  target_sets: number
  target_reps_low: number
  target_reps_high: number
  rest_seconds_override: number | null
  warmup_protocol: string | null
  execution_cues: string | null
  exercises: {
    id: string
    slug: string
    name: string
    category: 'compound' | 'isolation'
    primary_muscle: string
  }
  prescribed_sets: Array<{
    id: string
    set_index: number
    target_pct_of_working: number
    target_reps_low: number
    target_reps_high: number
    rpe_target: number | null
    is_warmup: boolean
  }>
}

export type SequenceStep = {
  programExerciseId: string
  setIndex: number
  superset?: {
    group: 'A' | 'B'
    position: 1 | 2
    round: number
    totalRounds: number
    partnerProgramExerciseId: string
  }
}

/**
 * Construit la séquence de sets à effectuer dans l'ordre d'exécution.
 * - Pour les exos pyramidaux ou standalone : sets 1..N séquentiels
 * - Pour les supersets : interleaving round-by-round (A1, B1, A2, B2, ...)
 */
export function buildSetSequence(
  programExercises: ProgramExerciseLike[],
): SequenceStep[] {
  const sorted = [...programExercises].sort(
    (a, b) => a.order_index - b.order_index,
  )
  const sequence: SequenceStep[] = []

  let i = 0
  while (i < sorted.length) {
    const exo = sorted[i]

    if (exo.superset_position === 1 && exo.superset_group) {
      const partner = sorted[i + 1]
      if (
        !partner ||
        partner.superset_group !== exo.superset_group ||
        partner.superset_position !== 2
      ) {
        throw new Error(
          `Superset incomplet : ${exo.exercises.slug} sans partenaire valide`,
        )
      }
      const maxRounds = Math.max(exo.target_sets, partner.target_sets)
      for (let round = 1; round <= maxRounds; round++) {
        if (round <= exo.target_sets) {
          sequence.push({
            programExerciseId: exo.id,
            setIndex: round,
            superset: {
              group: exo.superset_group,
              position: 1,
              round,
              totalRounds: maxRounds,
              partnerProgramExerciseId: partner.id,
            },
          })
        }
        if (round <= partner.target_sets) {
          sequence.push({
            programExerciseId: partner.id,
            setIndex: round,
            superset: {
              group: partner.superset_group as 'A' | 'B',
              position: 2,
              round,
              totalRounds: maxRounds,
              partnerProgramExerciseId: exo.id,
            },
          })
        }
      }
      i += 2
    } else {
      for (let setIdx = 1; setIdx <= exo.target_sets; setIdx++) {
        sequence.push({ programExerciseId: exo.id, setIndex: setIdx })
      }
      i++
    }
  }
  return sequence
}

/** Arrondi au step le plus proche. */
export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

/** Pourcentage de 1RM utilisé comme "charge de travail" (set 100% du pyramidal). */
export const WORKING_PCT_OF_1RM = 0.825

/** Calcule le poids suggéré pour un set, ou null si pas de 1RM connu. */
export function suggestedWeight(
  oneRmKg: number | null | undefined,
  targetPctOfWorking: number,
  isCompound: boolean,
): number | null {
  if (!oneRmKg) return null
  const w = oneRmKg * WORKING_PCT_OF_1RM * targetPctOfWorking
  return roundToStep(w, isCompound ? 2.5 : 1)
}

/** Temps de repos selon le rôle + override éventuel. */
export function computeRestSeconds(
  exo: ProgramExerciseLike,
  step: SequenceStep,
  params: ProtectedParams,
): number {
  if (exo.rest_seconds_override != null) return exo.rest_seconds_override
  if (exo.is_pyramidal) return params.rest_compound_s
  if (step.superset) {
    return step.superset.position === 1
      ? params.rest_superset_intra_s
      : params.rest_superset_inter_s
  }
  return params.rest_isolation_s
}

/** Step d'incrémentation du poids selon catégorie. */
export function weightStep(isCompound: boolean): number {
  return isCompound ? 2.5 : 1
}
