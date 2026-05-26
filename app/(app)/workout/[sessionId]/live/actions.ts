'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type LogSetInput = {
  workoutSessionId: string
  programExerciseId: string
  prescribedSetId: string | null
  exerciseId: string
  setIndex: number
  weightKg: number
  reps: number
  rpe: number | null
  restSecondsActual?: number | null
}

export type LoggedSetRow = {
  id: string
  workout_session_id: string
  program_exercise_id: string | null
  prescribed_set_id: string | null
  exercise_id: string
  set_index: number
  weight_kg: number
  reps: number
  rpe: number | null
  rest_seconds_actual: number | null
  completed_at: string
}

export async function logSet(input: LogSetInput): Promise<LoggedSetRow> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('not authenticated')

  const { data, error } = await supabase
    .from('exercise_sets')
    .insert({
      user_id: user.id,
      workout_session_id: input.workoutSessionId,
      program_exercise_id: input.programExerciseId,
      prescribed_set_id: input.prescribedSetId,
      exercise_id: input.exerciseId,
      set_index: input.setIndex,
      weight_kg: input.weightKg,
      reps: input.reps,
      rpe: input.rpe,
      rest_seconds_actual: input.restSecondsActual ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(`logSet failed: ${error.message}`)
  return data as LoggedSetRow
}

export async function finishSession(workoutSessionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('workout_sessions')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('id', workoutSessionId)
    .eq('user_id', user.id)

  if (error) {
    redirect(`/workout?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/workout')
  revalidatePath('/dashboard')
  redirect('/workout')
}
