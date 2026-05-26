'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function startWorkoutSession(formData: FormData) {
  const programSessionId = formData.get('program_session_id')
  if (typeof programSessionId !== 'string') {
    redirect('/workout?error=missing_session_id')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: inserted, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      program_session_id: programSessionId,
      status: 'in_progress',
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/workout?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/workout')
  redirect(`/workout/${inserted.id}/live`)
}

export async function resumeWorkoutSession(formData: FormData) {
  const workoutSessionId = formData.get('workout_session_id')
  if (typeof workoutSessionId !== 'string') {
    redirect('/workout?error=missing_workout_id')
  }
  redirect(`/workout/${workoutSessionId}/live`)
}

export async function abandonWorkoutSession(formData: FormData) {
  const workoutSessionId = formData.get('workout_session_id')
  if (typeof workoutSessionId !== 'string') {
    redirect('/workout?error=missing_workout_id')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('workout_sessions')
    .update({ status: 'abandoned', ended_at: new Date().toISOString() })
    .eq('id', workoutSessionId)
    .eq('user_id', user.id)

  revalidatePath('/workout')
  redirect('/workout')
}
