import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Dashboard — coach-lifestyle',
}

// Stub Phase 1 — étape H ajoutera le radar 6 stats + formule Vitalité.
export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Connecté :{' '}
          <span className="font-mono text-neutral-700 dark:text-neutral-300">
            {user?.email}
          </span>
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Actions
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionCard
            href="/workout"
            title="Lancer une séance"
            description="Choisis une séance du programme et logge tes sets."
          />
          <ActionCard
            href="/setup/one-rep-maxes"
            title="Saisir mes 1RM"
            description="Met à jour les 1RM — utilisés pour suggérer les poids."
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Vitalité
        </h2>
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
          Le radar 6 stats arrive en étape H.
        </div>
      </section>
    </div>
  )
}

function ActionCard({
  href,
  title,
  description,
}: {
  href: string
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800"
    >
      <div className="flex-1 space-y-0.5">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-neutral-500">{description}</div>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-neutral-400"
        aria-hidden="true"
      />
    </Link>
  )
}
