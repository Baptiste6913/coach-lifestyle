/**
 * Seed du programme v7 (programs + program_sessions + program_exercises +
 * prescribed_sets) à partir de data/program-v7.json.
 *
 * SCRIPT DE SEED MANUEL LOCAL UNIQUEMENT.
 * Ne pas exécuter en CI, ni sur Vercel, ni en prod.
 * Utilise SUPABASE_SERVICE_ROLE_KEY qui BYPASS la RLS.
 *
 * Idempotent : UPSERT sur clés naturelles (program_id+name, program_session_id+order_index, etc.).
 * Validation phase 1 (lecture seule) avant tout INSERT en phase 2.
 *
 * Usage : npx tsx scripts/seed-program-v7.ts
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import {
  programSchema,
  generatePrescribedSets,
} from '../data/program-v7.types'
import type { Database } from '../lib/database.types'

// --- HARDENING -------------------------------------------------------------
if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.CI) {
  console.error('[seed] REFUSED: script not allowed in production / Vercel / CI')
  process.exit(1)
}

loadEnv({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OWNER_EMAIL = process.env.OWNER_EMAIL?.trim() || null

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '[seed] Missing env vars NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local',
  )
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// --- HELPERS ---------------------------------------------------------------
async function resolveOwnerId(): Promise<string> {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 })
  if (error) throw new Error(`auth.admin.listUsers failed: ${error.message}`)
  const users = data.users
  if (OWNER_EMAIL) {
    const u = users.find((u) => u.email === OWNER_EMAIL)
    if (!u) throw new Error(`No auth.users with email ${OWNER_EMAIL}`)
    return u.id
  }
  if (users.length === 1) {
    console.log(`[seed] OWNER_EMAIL not set → using sole user: ${users[0].email}`)
    return users[0].id
  }
  throw new Error(
    `Multiple users (${users.length}) found and no OWNER_EMAIL set in .env.local`,
  )
}

// --- MAIN ------------------------------------------------------------------
async function main() {
  console.log('[seed] PHASE 1 — Validation (read-only)')

  const userId = await resolveOwnerId()
  console.log(`[seed]   owner user_id: ${userId}`)

  const json = JSON.parse(readFileSync('./data/program-v7.json', 'utf-8'))
  const program = programSchema.parse(json)
  console.log(`[seed]   JSON Zod-validated: ${program.sessions.length} sessions`)

  // Verify all slugs exist in exercises
  const allSlugs = new Set<string>()
  for (const s of program.sessions) {
    for (const e of s.exercises) allSlugs.add(e.exercise_slug)
  }
  const { data: exos, error: exoErr } = await supabase
    .from('exercises')
    .select('id, slug, primary_muscle, category')
    .in('slug', Array.from(allSlugs))
  if (exoErr) throw new Error(`exercises lookup failed: ${exoErr.message}`)
  const exoBySlug = new Map(exos!.map((e) => [e.slug, e]))
  const missing = Array.from(allSlugs).filter((s) => !exoBySlug.has(s))
  if (missing.length) {
    throw new Error(`Exercises not found in DB: ${missing.join(', ')}`)
  }
  console.log(`[seed]   all ${allSlugs.size} exercise slugs present in DB`)

  // Validate supersets (primary_muscle different + not 2 compounds)
  const errors: string[] = []
  for (const session of program.sessions) {
    const groups = new Map<string, typeof session.exercises>()
    for (const e of session.exercises) {
      if (e.superset_group) {
        const arr = groups.get(e.superset_group) ?? []
        arr.push(e)
        groups.set(e.superset_group, arr)
      }
    }
    for (const [grp, exos] of groups) {
      const exoData = exos.map((e) => exoBySlug.get(e.exercise_slug)!)
      const muscles = new Set(exoData.map((e) => e.primary_muscle))
      if (muscles.size === 1) {
        errors.push(
          `${session.name} SS-${grp}: same primary_muscle "${exoData[0].primary_muscle}" on both exos`,
        )
      }
      const compoundCount = exoData.filter((e) => e.category === 'compound').length
      if (compoundCount === 2) {
        errors.push(`${session.name} SS-${grp}: both exercises are compounds`)
      }
    }
  }
  if (errors.length) {
    console.error('[seed] VALIDATION FAILED:')
    errors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }
  console.log(`[seed]   supersets validated`)

  console.log('[seed] PHASE 2 — UPSERTs')

  // Program
  const { data: progRow, error: progErr } = await supabase
    .from('programs')
    .upsert(
      {
        user_id: userId,
        name: program.name,
        version: program.version,
        phase: program.phase,
        frequency_per_week: program.frequency_per_week,
        duration_weeks: program.duration_weeks,
        raw_text: program.raw_text,
        protected_params: program.protected_params,
        notes: program.notes ?? null,
      },
      { onConflict: 'user_id,name,version' },
    )
    .select('id')
    .single()
  if (progErr) throw new Error(`programs upsert: ${progErr.message}`)
  const programId = progRow.id
  console.log(`[seed]   program ${program.name} v${program.version} → ${programId}`)

  let sessionsCount = 0
  let exercisesCount = 0
  let prescribedCount = 0

  for (const session of program.sessions) {
    const { data: sessRow, error: sessErr } = await supabase
      .from('program_sessions')
      .upsert(
        {
          user_id: userId,
          program_id: programId,
          name: session.name,
          day_of_week: session.day_of_week,
          order_index: session.order_index,
          target_sets_total: session.target_sets_total ?? null,
          notes: session.notes ?? null,
        },
        { onConflict: 'program_id,name' },
      )
      .select('id')
      .single()
    if (sessErr) throw new Error(`program_sessions upsert ${session.name}: ${sessErr.message}`)
    const sessionId = sessRow.id
    sessionsCount++

    for (const exo of session.exercises) {
      const exoData = exoBySlug.get(exo.exercise_slug)!
      const { data: peRow, error: peErr } = await supabase
        .from('program_exercises')
        .upsert(
          {
            user_id: userId,
            program_session_id: sessionId,
            exercise_id: exoData.id,
            order_index: exo.order_index,
            is_pyramidal: exo.is_pyramidal,
            superset_group: exo.superset_group,
            superset_position: exo.superset_position,
            target_sets: exo.target_sets,
            target_reps_low: exo.target_reps_low,
            target_reps_high: exo.target_reps_high,
            rest_seconds_override: exo.rest_seconds_override ?? null,
            warmup_protocol: exo.warmup_protocol ?? null,
            execution_cues: exo.execution_cues ?? null,
            notes: exo.notes ?? null,
          },
          { onConflict: 'program_session_id,order_index' },
        )
        .select('id')
        .single()
      if (peErr)
        throw new Error(
          `program_exercises upsert ${session.name}/${exo.exercise_slug}: ${peErr.message}`,
        )
      const peId = peRow.id
      exercisesCount++

      // Generate + UPSERT prescribed_sets
      const sets = generatePrescribedSets(exo, program.protected_params.pyramidal_pct)
      const rows = sets.map((s) => ({
        user_id: userId,
        program_exercise_id: peId,
        set_index: s.set_index,
        target_pct_of_working: s.target_pct_of_working,
        target_reps_low: s.target_reps_low,
        target_reps_high: s.target_reps_high,
        rpe_target: s.rpe_target,
        is_warmup: s.is_warmup,
      }))
      const { error: psErr } = await supabase
        .from('prescribed_sets')
        .upsert(rows, { onConflict: 'program_exercise_id,set_index' })
      if (psErr) throw new Error(`prescribed_sets upsert: ${psErr.message}`)
      prescribedCount += sets.length
    }
  }

  console.log('[seed] DONE.')
  console.log(`  programs:           1`)
  console.log(`  program_sessions:   ${sessionsCount}`)
  console.log(`  program_exercises:  ${exercisesCount}`)
  console.log(`  prescribed_sets:    ${prescribedCount}`)
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e)
  console.error(`[seed] FAILED: ${msg}`)
  process.exit(1)
})
