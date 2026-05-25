'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// Onboarding flow (one-shot, see PROGRESS.md D20+) :
//   1. "Enable email signups" = ON dans Supabase Studio pour permettre
//      le tout 1er login (création auto de auth.users à l'envoi du magic link).
//   2. Après le 1er login réussi, désactiver "Enable email signups"
//      dans Studio pour bloquer toute autre inscription.
//   La table auth.users est gérée par Supabase, jamais touchée par notre code.

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
})

export type LoginState = {
  status: 'idle' | 'sent' | 'error'
  message?: string
}

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'Email invalide',
    }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin =
    headersList.get('origin') ??
    `http://${headersList.get('host') ?? 'localhost:3000'}`

  const emailRedirectTo = `${origin}/auth/callback`

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo },
  })

  if (error) {
    return { status: 'error', message: error.message }
  }

  return {
    status: 'sent',
    message: 'Vérifie ta boîte mail. Le lien expire dans 1 heure.',
  }
}
