import Link from 'next/link'
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
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-neutral-500">
          Connecté en tant que <span className="font-mono">{user?.email}</span>.
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
            description="Mets à jour les 1RM des compounds — utilisés pour suggérer les poids."
          />
        </div>
      </section>

      <p className="text-sm text-neutral-500">
        Le radar 6 stats arrive en étape H. Pour l&apos;instant : stub auth.
      </p>
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
      className="block rounded-md border border-neutral-200 bg-white p-3 transition hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600 dark:hover:bg-neutral-900"
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-0.5 text-xs text-neutral-500">{description}</div>
    </Link>
  )
}
