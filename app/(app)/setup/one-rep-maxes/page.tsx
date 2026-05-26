import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { saveOneRepMaxes } from './actions'

export const metadata = {
  title: '1RM — coach-lifestyle',
}

export default async function OneRepMaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; count?: string; msg?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const { data: pyramidalExos } = await supabase
    .from('program_exercises')
    .select(
      'exercise_id, exercises!inner(id, slug, name, primary_muscle, category)',
    )
    .eq('is_pyramidal', true)

  if (!pyramidalExos || pyramidalExos.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">1RM compounds</h1>
        <p className="text-sm text-neutral-500">
          Aucun exercice pyramidal trouvé. Le programme a-t-il été seedé ?
        </p>
      </div>
    )
  }

  const uniqExos = Array.from(
    new Map(
      pyramidalExos.map((row) => [row.exercise_id, row.exercises]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name, 'fr'))

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
        <h1 className="text-xl font-semibold tracking-tight">
          1RM des compounds pyramidaux
        </h1>
        <p className="text-sm text-neutral-500">
          <span className="font-mono tabular-nums">{uniqExos.length}</span>{' '}
          exercices. Remplis ce qui a changé ; les champs vides sont ignorés.
          Le poids de travail = 1RM × 0.825.
        </p>
      </header>

      {sp.status === 'saved' && (
        <p
          role="status"
          className="flex min-h-12 items-center rounded-lg border border-green-300 bg-green-50 px-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          <span className="font-mono tabular-nums">{sp.count}</span>
          <span>&nbsp;1RM mis à jour.</span>
        </p>
      )}
      {sp.status === 'no-change' && (
        <p className="flex min-h-12 items-center rounded-lg border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          Aucune valeur saisie.
        </p>
      )}
      {sp.status === 'error' && (
        <p
          role="alert"
          className="flex min-h-12 items-center rounded-lg border border-red-300 bg-red-50 px-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
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
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-medium truncate">{exo.name}</div>
                <div className="text-xs text-neutral-500">
                  {exo.primary_muscle}
                  {current ? (
                    <>
                      {' · actuel : '}
                      <span className="font-mono tabular-nums">
                        {current.one_rm_kg}
                      </span>
                      {' kg ('}
                      <span className="font-mono tabular-nums">
                        {current.valid_from}
                      </span>
                      {')'}
                    </>
                  ) : (
                    ' · aucun 1RM enregistré'
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  name={`one_rm_kg[${exo.id}]`}
                  type="number"
                  step="0.5"
                  min="0"
                  max="500"
                  inputMode="decimal"
                  placeholder={current ? String(current.one_rm_kg) : 'kg'}
                  className="w-24 min-h-12 rounded-md border border-neutral-300 bg-white px-2 text-right text-base font-mono tabular-nums focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-950"
                />
                <span className="text-xs text-neutral-500">kg</span>
              </div>
            </div>
          )
        })}

        <Button type="submit" variant="primary" size="md" className="w-full">
          Enregistrer
        </Button>
      </form>
    </div>
  )
}
