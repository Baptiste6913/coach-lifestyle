'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { sendMagicLink, type LoginState } from './actions'

const initialState: LoginState = { status: 'idle' }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-xs font-medium uppercase tracking-wider text-neutral-500"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          inputMode="email"
          placeholder="toi@example.com"
          className="w-full min-h-12 rounded-md border border-neutral-300 bg-white px-3 text-base focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={pending}
        className="w-full"
      >
        {pending ? 'Envoi…' : 'Envoyer le lien magique'}
      </Button>
      {state.status === 'sent' && (
        <p
          role="status"
          className="flex min-h-12 items-center rounded-lg border border-green-300 bg-green-50 px-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          {state.message}
        </p>
      )}
      {state.status === 'error' && (
        <p
          role="alert"
          className="flex min-h-12 items-center rounded-lg border border-red-300 bg-red-50 px-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
