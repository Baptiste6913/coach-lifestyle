# PROGRESS — coach-lifestyle

Journal chronologique des décisions et de l'avancement par phase.

---

## 2026-05-19 — Bootstrap du projet (Phase 1 — Vitality)

### Décisions structurelles

| # | Décision | Raison |
|---|---|---|
| D1 | Path local : `/Users/baptiste/coach-lifestyle/` | Match exact du repo GitHub. "vitality-tracker" rejeté — le projet couvre 6 domaines, Phase 1 ≠ projet global |
| D2 | Stack figée : Next.js 16 + Supabase + Vercel | Cohérence doc projet ; Server Actions = appels Anthropic API server-side sécurisés ; pas de backend séparé |
| D3 | `prescribed_sets` stockés explicitement (1 ligne/set) | Flexibilité future (deload, pyramide non-uniforme) + queryable sans recalcul |
| D4 | Schéma orthogonalisé `program_exercises` : `is_pyramidal` + `superset_group` + `superset_position` (pas d'enum `role`) | Sépare nature biomécanique (category sur `exercises`) du rôle dans la séance. Résout naturellement "Écarté poulie haute = isolation pyramidée" |
| D5 | Règle superset assouplie : `primary_muscle` différents + pas 2 compounds (PAS antagonisme strict) | Règle réelle observée dans v7 (curl + face pull, élév lat + triceps). JSON initial trop strict |
| D6 | Pull B SS2 : Curl marteau + Cable Crunches = standalone, pas superset | Confirmé par pratique réelle owner (60-75s rest, pas 15s) |
| D7 | RPE target peuplé auto à l'import : compound set 3 = RPE 9 ; SS1 = 9 ; SS2/iso standalone = 10 ; pyramide sets 1+2 = NULL (warmup) | Conversion RIR → RPE = 10 - RIR. Override par exo dans setup wizard (Phase 1 — étape D) |
| D8 | Décompte sets : on stocke tout (incluant pyramide sets 1+2). Dashboard volume Phase 3 filtrera `rpe_target IS NOT NULL` (= working sets uniquement) | Convention owner "18 working sets" exclut les sets pyramidaux d'échauffement |
| D9 | Tempo ignoré Phase 1 | À reconsidérer Phase 7 (coach LLM) |
| D10 | Vitalité Phase 1 = formule simple `MIN(10, sessions_28j × 10 / 16)` | 5 autres axes radar à 0. Enrichissement Phase 2+ |
| D11 | 1RM Phase 1 = saisie manuelle par compound. Phase 3 = estimation Epley auto sur sets RPE≥8 récents | Cohérent avec brief utilisateur |
| D12 | RLS activée sur toutes les tables dès J1, même en solo | Futureproof (cas multi-user éventuel) |
| D13 | `exercises` per-user en Phase 1 (catalogue privé) | Simplifie l'isolation. Phase 7+ pourra mutualiser un sous-ensemble |
| D14 | Migrations SQL natives Supabase (pas Drizzle/Prisma) | Reste proche de l'outil, types TS générés via `supabase gen types` |

### Réalisations bootstrap

- [x] Repo cloné depuis GitHub (`gh repo clone`, HTTPS — SSH port 22 bloqué)
- [x] Next.js 16.2.6 initialisé (TS + Tailwind 4 + ESLint + App Router + `src/`)
- [x] Deps installées : `@supabase/ssr`, `@supabase/supabase-js`, `@tanstack/react-query`, `@tanstack/react-query-devtools`, `zod`, `supabase` CLI (dev)
- [x] Fichier `data/import/program-v7-exercises.md` sauvegardé depuis tmp WhatsApp
- [x] Migration SQL initiale rédigée : `supabase/migrations/20260519172500_init_schema.sql` — **EN ATTENTE DE VALIDATION OWNER AVANT APPLY**
- [x] `prompts/PHASE_1_VITALITY.md` créé avec la liste des étapes A → I
- [x] CLAUDE.md projet rédigé

### Points en attente

- [ ] **VALIDATION SQL** par owner avant `supabase db push` ou exécution manuelle
- [ ] Création du projet Supabase (URL + anon key + service_role key → `.env.local`)
- [ ] Lien Vercel
- [ ] Première connexion magic link (création de l'utilisateur unique `auth.users`)

### Notes techniques

- `create-next-app@latest` a installé **Next 16** et non Next 15. AGENTS.md auto-généré flagge des breaking changes. À confirmer : on reste sur Next 16 ou on downgrade à 15.
- Tailwind 4 (nouveau, syntaxe différente de v3). shadcn/ui devra être init avec un preset compatible v4.
- Pas de Drizzle / Prisma — types générés directement par `supabase gen types typescript --local > src/lib/db/types.ts` (à exécuter après apply migration).

---

## Phase 1 — Vitality (en cours)

### Étapes (suivi)

| Étape | Description | Statut | Critère "ça marche" |
|---|---|---|---|
| A | Schémas DB + RLS | **En attente review SQL** | `\d` dans psql liste 8 tables ; insert anon refusé ; insert authenticated OK |
| B | Seed `exercises` (29 exos du programme v7) | À faire | 29 lignes, chaque isolation a `primary_muscle` set |
| C | Script `import:program-v7` | À faire | Idempotent ; 1 program + 4 sessions + N exos + prescribed_sets cohérents |
| D | Setup wizard exercices (+ override RPE) | À faire | UI permet ajout/réordonnement ; validation supersets |
| E | Saisie initiale 1RM | À faire | 1 ligne `exercise_1rm_history` par compound ; suggested weight correct |
| F | Live screen séance | À faire | Démarrer Pull A → set 1 bench → log → timer 120s → set 2 affiché |
| G | Supersets fonctionnels | À faire | Timer 15s intra-paire, 90s inter-paire ; `rest_seconds_actual` mesuré |
| H | Dashboard radar 6 stats | À faire | 0 séance → vitalité 0 ; 16 sessions → vitalité 10 ; 5 axes à 0 |
| I | Test mobile gym | À faire | Séance Pull A complète sans bug, latence <100ms perçue |
| J | Résilience réseau | À faire | Wifi off → 3 sets loggués → wifi on → 3 sets en DB |
