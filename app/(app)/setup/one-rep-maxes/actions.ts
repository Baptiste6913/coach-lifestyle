'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Schéma : un input vide est ignoré. Si rempli, doit être un nombre > 0.
const oneRmRowSchema = z.object({
  exercise_id: z.string().uuid(),
  one_rm_kg: z.coerce.number().positive().max(500),
})

export async function saveOneRepMaxes(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Collecte les inputs au format one_rm_kg[<exercise_id>] = "<value>"
  const inserts: Array<{ exercise_id: string; one_rm_kg: number }> = []
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string' || value.trim() === '') continue
    const match = key.match(/^one_rm_kg\[([0-9a-f-]{36})\]$/)
    if (!match) continue
    const parsed = oneRmRowSchema.safeParse({
      exercise_id: match[1],
      one_rm_kg: value,
    })
    if (!parsed.success) continue
    inserts.push(parsed.data)
  }

  if (inserts.length === 0) {
    redirect('/setup/one-rep-maxes?status=no-change')
  }

  const today = new Date().toISOString().slice(0, 10)
  const rows = inserts.map((i) => ({
    user_id: user.id,
    exercise_id: i.exercise_id,
    one_rm_kg: i.one_rm_kg,
    estimated: false,
    source: 'manual',
    valid_from: today,
  }))

  const { error } = await supabase.from('exercise_1rm_history').insert(rows)
  if (error) {
    redirect(
      `/setup/one-rep-maxes?status=error&msg=${encodeURIComponent(error.message)}`,
    )
  }

  revalidatePath('/setup/one-rep-maxes')
  redirect(`/setup/one-rep-maxes?status=saved&count=${inserts.length}`)
}
