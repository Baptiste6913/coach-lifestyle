import { createClient } from '@/lib/supabase/server'
import { saveOneRepMaxes } from './actions'

export const metadata = {
  title: '1RM — coach-lifestyle',
}

// Affiche les 12 exos pyramidaux du programme actif (compounds + isolations pyramidées).
// L'user saisit ses 1RM ; chaque submit insère une nouvelle ligne dans
// exercise_1rm_history avec valid_from = aujourd'hui.
//
// Inputs vides = ignorés. Inputs remplis = INSERT, même si valeur identique.
export default async function OneRepMaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; count?: string; msg?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  // Récupérer les exercices pyramidaux du programme actif (le plus récent).
  // Distinct sur exercise_id pour gérer le cas où un exo est pyramidal dans
  // plusieurs sessions (pas le cas en v7 mais sécurise le futur).
  const { data: pyramidalExos } = await supabase
    .from('program_exercises')
    .select(
      'exercise_id, exercises!inner(id, slug, name, primary_muscle, category)',
    )
    .eq('is_pyramidal', true)

  if (!pyramidalExos || pyramidalExos.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">1RM compounds</h1>
        <p className="text-sm text-neutral-500">
          Aucun exercice pyramidal trouvé. Le programme a-t-il été seedé ?
        </p>
      </div>
    )
  }

  // Dédup par exercise_id (face-pulls n'est PAS pyramidal mais sécurise au cas où).
  const uniqExos = Array.from(
    new Map(
      pyramidalExos.map((row) => [row.exercise_id, row.exercises]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  // Récupérer le 1RM courant (le plus récent) de chaque exercice.
  const exerciseIds = uniqExos.map((e) => e.id)
  const { data: history } = await supabase
    .from('exercise_1rm_history')
    .select('exercise_id, one_rm_kg, valid_from')
    .in('exercise_id', exerciseIds)
    .order('valid_from', { ascending: false })

  const currentByExoId = new Map<
    string,
    { one_rm_kg: number; valid_from: string }
  >()
  for (const row of history ?? []) {
    if (!currentByExoId.has(row.exercise_id)) {
      currentByExoId.set(row.exercise_id, {
        one_rm_kg: row.one_rm_kg,
        valid_from: row.valid_from,
      })
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">1RM des compounds pyramidaux</h1>
        <p className="text-sm text-neutral-500">
          {uniqExos.length} exercices. Remplis ce qui a changé ; les champs
          vides sont ignorés. Le poids de travail = 1RM × 0.825.
        </p>
      </header>

      {sp.status === 'saved' && (
        <p
          role="status"
          className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          {sp.count} 1RM mis à jour.
        </p>
      )}
      {sp.status === 'no-change' && (
        <p className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          Aucune valeur saisie.
        </p>
      )}
      {sp.status === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          Erreur : {sp.msg ?? 'unknown'}
        </p>
      )}

      <form action={saveOneRepMaxes} className="space-y-3">
        {uniqExos.map((exo) => {
          const current = currentByExoId.get(exo.id)
          return (
            <div
              key={exo.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{exo.name}</div>
                <div className="text-xs text-neutral-500">
                  {exo.primary_muscle} ·{' '}
                  {current
                    ? `actuel : ${current.one_rm_kg} kg (${current.valid_from})`
                    : 'aucun 1RM enregistré'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <input
                  name={`one_rm_kg[${exo.id}]`}
                  type="number"
                  step="0.5"
                  min="0"
                  max="500"
                  inputMode="decimal"
                  placeholder={current ? String(current.one_rm_kg) : 'kg'}
                  className="w-24 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-right text-base focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100"
                />
                <span className="text-xs text-neutral-500">kg</span>
              </div>
            </div>
          )
        })}

        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Enregistrer
        </button>
      </form>
    </div>
  )
}
