import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Garde d'authentification pour toutes les pages du groupe (app).
// Si pas de session → redirect /login. La RLS Postgres reste la dernière
// ligne de défense — cette garde côté Next n'est qu'une commodité UX.

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold tracking-tight">
            coach-lifestyle
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-screen-md px-4 py-6">{children}</main>
    </div>
  )
}
