// Types et schémas de validation pour le programme v7.
// Source de vérité = les schémas Zod (les types TS sont inférés).
// Le script de seed valide le JSON avec ces schémas au démarrage.
//
// Conventions :
// - is_pyramidal=true → 3 sets seront générés en prescribed_sets (70/85/100%, RPE null/null/9)
// - is_pyramidal=false + superset_group=null → N sets standalone, RPE 10
// - is_pyramidal=false + superset_group='A' → N sets, RPE 9 (1 RIR sur SS-A par convention v7)
// - is_pyramidal=false + superset_group='B' → N sets, RPE 10 (échec sur SS-B)
// Les rest_seconds sont dérivés à l'exécution (live screen) selon le rôle, sauf override explicite.

import { z } from 'zod'

export const programExerciseSchema = z
  .object({
    order_index: z.number().int().positive(),
    exercise_slug: z.string().min(1),
    is_pyramidal: z.boolean(),
    superset_group: z.enum(['A', 'B']).nullable(),
    superset_position: z.union([z.literal(1), z.literal(2)]).nullable(),
    target_sets: z.number().int().positive(),
    target_reps_low: z.number().int().positive(),
    target_reps_high: z.number().int().positive(),
    rest_seconds_override: z.number().int().positive().optional(),
    warmup_protocol: z.string().optional(),
    execution_cues: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (e) => (e.superset_group === null) === (e.superset_position === null),
    {
      message:
        'superset_group et superset_position doivent être tous les deux NULL ou tous les deux définis',
    },
  )
  .refine((e) => e.target_reps_high >= e.target_reps_low, {
    message: 'target_reps_high doit être >= target_reps_low',
  })

export const programSessionSchema = z
  .object({
    name: z.string().min(1),
    day_of_week: z.number().int().min(1).max(7),
    order_index: z.number().int().positive(),
    target_sets_total: z.number().int().positive().optional(),
    notes: z.string().optional(),
    exercises: z.array(programExerciseSchema).min(1),
  })
  .refine(
    (s) => {
      // Chaque superset_group de la séance doit avoir exactement 2 exos
      // avec superset_position 1 et 2.
      const groups = new Map<string, number[]>()
      for (const e of s.exercises) {
        if (e.superset_group) {
          const positions = groups.get(e.superset_group) ?? []
          positions.push(e.superset_position!)
          groups.set(e.superset_group, positions)
        }
      }
      for (const positions of groups.values()) {
        const sorted = [...positions].sort()
        if (sorted.length !== 2 || sorted[0] !== 1 || sorted[1] !== 2) {
          return false
        }
      }
      return true
    },
    {
      message:
        'chaque superset_group doit avoir exactement 2 exos avec positions {1, 2}',
    },
  )
  .refine(
    (s) => {
      // order_index unique au sein de la séance
      const seen = new Set<number>()
      for (const e of s.exercises) {
        if (seen.has(e.order_index)) return false
        seen.add(e.order_index)
      }
      return true
    },
    { message: 'order_index doit être unique au sein de la séance' },
  )

export const programSchema = z
  .object({
    name: z.string().min(1),
    version: z.number().int().positive(),
    phase: z.string().min(1),
    frequency_per_week: z.number().int().min(1).max(7),
    duration_weeks: z.number().int().positive().nullable(),
    raw_text: z.string().min(1),
    protected_params: z.object({
      pyramidal_pct: z.tuple([
        z.number().positive().max(1),
        z.number().positive().max(1),
        z.number().positive().max(1),
      ]),
      rest_compound_s: z.number().int().positive(),
      rest_isolation_s: z.number().int().positive(),
      rest_superset_intra_s: z.number().int().positive(),
      rest_superset_inter_s: z.number().int().positive(),
    }),
    notes: z.string().optional(),
    sessions: z.array(programSessionSchema).min(1),
  })
  .refine(
    (p) => {
      // Pas 2 sessions avec le même name ou même order_index
      const names = new Set<string>()
      const orders = new Set<number>()
      for (const s of p.sessions) {
        if (names.has(s.name)) return false
        if (orders.has(s.order_index)) return false
        names.add(s.name)
        orders.add(s.order_index)
      }
      return true
    },
    { message: 'sessions doivent avoir name et order_index uniques' },
  )

export type ProgramExercise = z.infer<typeof programExerciseSchema>
export type ProgramSession = z.infer<typeof programSessionSchema>
export type Program = z.infer<typeof programSchema>

// Génération des prescribed_sets à partir d'une program_exercise.
// Logique pure, testable unitairement.
export type PrescribedSetSpec = {
  set_index: number
  target_pct_of_working: number // 0.70, 0.85, 1.00...
  target_reps_low: number
  target_reps_high: number
  rpe_target: number | null
  is_warmup: boolean
}

export function generatePrescribedSets(
  pe: ProgramExercise,
  pyramidalPct: [number, number, number],
): PrescribedSetSpec[] {
  if (pe.is_pyramidal) {
    if (pe.target_sets !== 3) {
      throw new Error(
        `pyramidal exercise expects target_sets=3, got ${pe.target_sets} (${pe.exercise_slug})`,
      )
    }
    return [
      {
        set_index: 1,
        target_pct_of_working: pyramidalPct[0],
        target_reps_low: pe.target_reps_low,
        target_reps_high: pe.target_reps_high,
        rpe_target: null,
        is_warmup: true,
      },
      {
        set_index: 2,
        target_pct_of_working: pyramidalPct[1],
        target_reps_low: pe.target_reps_low,
        target_reps_high: pe.target_reps_high,
        rpe_target: null,
        is_warmup: true,
      },
      {
        set_index: 3,
        target_pct_of_working: pyramidalPct[2],
        target_reps_low: pe.target_reps_low,
        target_reps_high: pe.target_reps_high,
        rpe_target: 9, // working set : ~1 RIR
        is_warmup: false,
      },
    ]
  }

  // Charge constante.
  // RPE target selon le rôle :
  //   SS-A : 9 (1 RIR) — convention v7
  //   SS-B : 10 (échec)
  //   standalone isolation : 10
  const rpeTarget = pe.superset_group === 'A' ? 9 : 10

  return Array.from({ length: pe.target_sets }, (_, i) => ({
    set_index: i + 1,
    target_pct_of_working: 1.0,
    target_reps_low: pe.target_reps_low,
    target_reps_high: pe.target_reps_high,
    rpe_target: rpeTarget,
    is_warmup: false,
  }))
}
