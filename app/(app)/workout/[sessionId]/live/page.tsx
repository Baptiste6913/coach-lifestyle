import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LiveWorkout } from './live-workout'
import type { ProgramExerciseLike, ProtectedParams } from './sequence'

export const metadata = { title: 'Séance — coach-lifestyle' }

export default async function LiveWorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()

  // Workout session (avec son program_session parent et le program)
  const { data: workout } = await supabase
    .from('workout_sessions')
    .select(
      `id, status, started_at, program_session_id,
       program_sessions!inner(id, name, day_of_week, target_sets_total,
         programs!inner(id, name, protected_params))`,
    )
    .eq('id', sessionId)
    .maybeSingle()

  if (!workout) notFound()
  if (workout.status === 'completed' || workout.status === 'abandoned') {
    redirect('/workout')
  }

  const programSession = workout.program_sessions
  const program = programSession.programs

  // program_exercises + leur exercise + leurs prescribed_sets
  const { data: rawPE } = await supabase
    .from('program_exercises')
    .select(
      `id, exercise_id, order_index, is_pyramidal, superset_group,
       superset_position, target_sets, target_reps_low, target_reps_high,
       rest_seconds_override, warmup_protocol, execution_cues,
       exercises!inner(id, slug, name, category, primary_muscle),
       prescribed_sets(id, set_index, target_pct_of_working,
         target_reps_low, target_reps_high, rpe_target, is_warmup)`,
    )
    .eq('program_session_id', programSession.id)
    .order('order_index')

  const programExercises = (rawPE ?? []) as unknown as ProgramExerciseLike[]
  const exerciseIds = programExercises.map((pe) => pe.exercise_id)

  // 1RM courants (latest valid_from)
  const { data: oneRmRows } = await supabase
    .from('exercise_1rm_history')
    .select('exercise_id, one_rm_kg, valid_from')
    .in('exercise_id', exerciseIds)
    .order('valid_from', { ascending: false })

  const oneRmByExerciseId: Record<string, number> = {}
  for (const r of oneRmRows ?? []) {
    if (!(r.exercise_id in oneRmByExerciseId)) {
      oneRmByExerciseId[r.exercise_id] = Number(r.one_rm_kg)
    }
  }

  // Sets déjà loggés pour CETTE séance
  const { data: loggedSets } = await supabase
    .from('exercise_sets')
    .select(
      'id, workout_session_id, program_exercise_id, prescribed_set_id, exercise_id, set_index, weight_kg, reps, rpe, rest_seconds_actual, completed_at',
    )
    .eq('workout_session_id', sessionId)
    .order('completed_at')

  // Dernière perf par exo (toutes sessions sauf celle en cours)
  const { data: priorSets } = await supabase
    .from('exercise_sets')
    .select('exercise_id, weight_kg, reps, rpe, completed_at')
    .in('exercise_id', exerciseIds)
    .neq('workout_session_id', sessionId)
    .order('completed_at', { ascending: false })
    .limit(500)

  const lastSetByExerciseId: Record<
    string,
    { weight_kg: number; reps: number; rpe: number | null; completed_at: string }
  > = {}
  for (const r of priorSets ?? []) {
    if (!(r.exercise_id in lastSetByExerciseId)) {
      lastSetByExerciseId[r.exercise_id] = {
        weight_kg: Number(r.weight_kg),
        reps: r.reps,
        rpe: r.rpe != null ? Number(r.rpe) : null,
        completed_at: r.completed_at,
      }
    }
  }

  return (
    <LiveWorkout
      workoutSessionId={workout.id}
      programSessionName={programSession.name}
      protectedParams={program.protected_params as ProtectedParams}
      programExercises={programExercises}
      oneRmByExerciseId={oneRmByExerciseId}
      lastSetByExerciseId={lastSetByExerciseId}
      initialLoggedSets={(loggedSets ?? []).map((s) => ({
        ...s,
        weight_kg: Number(s.weight_kg),
        rpe: s.rpe != null ? Number(s.rpe) : null,
      }))}
    />
  )
}
