import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Dumbbell, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:border-neutral-800 dark:bg-neutral-950/85 dark:supports-[backdrop-filter]:bg-neutral-950/85">
        <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 transition-colors hover:opacity-80"
          >
            <Dumbbell size={16} className="text-orange-500" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight">
              coach-lifestyle
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-neutral-500 sm:inline">
              {user.email}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-neutral-300 px-3 text-xs font-medium transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                <LogOut size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  )
}
