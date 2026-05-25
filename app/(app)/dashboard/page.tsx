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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-neutral-500">
        Connecté en tant que <span className="font-mono">{user?.email}</span>.
      </p>
      <p className="text-sm text-neutral-500">
        Le radar 6 stats arrive en étape H. Pour l&apos;instant : stub auth.
      </p>
    </div>
  )
}
