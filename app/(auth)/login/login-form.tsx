'use client'

import { useActionState } from 'react'
import { sendMagicLink, type LoginState } from './actions'

const initialState: LoginState = { status: 'idle' }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  )

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
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
          placeholder="baptiste@example.com"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {pending ? 'Envoi…' : 'Envoyer le lien magique'}
      </button>
      {state.status === 'sent' && (
        <p
          role="status"
          className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          {state.message}
        </p>
      )}
      {state.status === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
