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
| D15 | **Next.js 16.2.6 figé** (pas de downgrade vers 15) | Version actuelle, Server Components/Actions stables entre 15 et 16, AGENTS.md déjà installé flagge les breaking changes, évite un upgrade futur. Décidé 2026-05-19 après bootstrap |
| D16 | Migration SQL `20260519172500_init_schema.sql` **validée** par owner après review (2026-05-19) | 8 tables + RLS + orthogonalisation. Pas encore appliquée — en attente création projet Supabase par owner |
| D17 | **Single-app, pas de monorepo Phase 1-8** | Phase 1-8 ne nécessitent pas Turborepo. `apps/sync` (Amazfit) = Phase 9, dans 4-6 mois minimum. Single-app plus simple à maintenir. Refactor monorepo sera fait à Phase 9 si nécessaire. Structure flat à la racine (`app/`, `components/`, `lib/`, `scripts/`, `docs/`, `prompts/`), `.env.local` à la racine. Path alias `@/*` → `./*` |
| D18 | Apply migration via **`supabase` CLI** (`supabase link` + `supabase db push`) puis `supabase gen types typescript --linked > lib/database.types.ts` | Permet de générer auto les types TS Postgres → TypeScript, gain de productivité/sûreté |
| D19 | **`exercises` = table de référence publique, PAS user-scoped** (correction 2026-05-25). `user_id` supprimée, `UNIQUE (slug)`, policy `SELECT TO authenticated USING (true)`, aucune policy INSERT/UPDATE/DELETE (writes réservées au service_role pour seed) | Bug de design détecté avant le seed : les 29 exos du programme v7 sont communs à tous les users, pas besoin de dupliquer par user. Spec initiale `prompts/PHASE_1_VITALITY.md` le mentionnait déjà ("pas user_id, c'est partagé"). Migration corrective `20260525110000_exercises_public_reference.sql`. Si Phase 7+ veut des exos custom par user, ajouter colonne `created_by UUID NULL` + policy adaptée |
| D20 | **Claude API hybride, on-demand uniquement, hard cap $15/mois Anthropic** | Ollama local rejeté (machine 24/7, qualité, complexité réseau). Claude API uniquement sur action user explicite (jamais de jobs automatiques). Phase 1 = zéro usage IA. L'import IA-based de programmes complets (parsing texte libre, classification exos) arrive en **Phase 1.5**, juste après Phase 1 |

### Décisions techniques notées (limitations connues)

- **Validation supersets en app-level uniquement.** Les règles "primary_muscle différent entre les 2 exos d'une paire" et "pas 2 compounds dans une paire" ne sont **pas** des CHECK constraints en DB (cross-row impossible sans trigger). Elles sont enforcées dans le script `import:program-v7` et dans la Server Action du setup wizard. Si un jour on veut une garantie DB-level, ajouter un trigger `BEFORE INSERT/UPDATE` sur `program_exercises` qui requête la paire et lève si violation. À reconsidérer si on ouvre l'édition multi-source (Phase 7+ coach LLM qui modifie le programme).
- **`.env.local` confirmé gitignored** par pattern `.env*` (.env.example whitelistée). Vérifié 2026-05-19 par `git check-ignore -v`.
- **Ports Postgres outbound (5432, 6543) bloqués depuis le réseau du owner** (firewall corporate/FAI restrictif — confirmé via Python socket test 2026-05-20 ; SSH port 22 aussi bloqué, cf. clone via HTTPS). Port 443 OK. Conséquence : **`supabase db push` et `supabase gen types --linked` impossibles** dans ces conditions. Workaround utilisé : **Supabase Management API** (HTTPS port 443) :
  - `POST /v1/projects/{ref}/database/query` pour appliquer les migrations (envoyer le SQL dans `{"query": "..."}`)
  - `GET /v1/projects/{ref}/types/typescript?included_schemas=public` pour les types (champ `types` à extraire)
  - Auth via header `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>` (PAT créé sur supabase.com/dashboard/account/tokens)
  - **Important** : utiliser `curl -d @fichier.json` PAS process substitution `-d @<(...)` qui tronque le payload silencieusement (l'API retourne 201 + `[]` sans rien faire, debug perdu 30 min)
  - Si possible, applique les futures migrations depuis un réseau permissif (home, mobile hotspot) via la CLI standard — c'est plus rapide. Workaround Management API à réutiliser si réseau restrictif.

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
| A | Schémas DB + RLS | **✓ FAIT 2026-05-20** | 8 tables + 8 policies RLS + 2 enums vérifiés via Management API. `lib/database.types.ts` généré (603 lignes) |
| A.1 | Refactor `exercises` → table publique (correction D19) | **✓ FAIT 2026-05-25** | `user_id` retiré, policy `exercises_public_read` (SELECT authenticated USING true), aucune policy write |
| B | Seed `exercises` (28 exos starter library) | **✓ FAIT 2026-05-25** | 28 lignes (29 instances - 1 doublon Face Pulls). 10 compounds / 18 isolations. Idempotence vérifiée (re-run → 28, 0 doublon). Starter library — l'import IA-based de programmes complets viendra en Phase 1.5 |
| C | Script `import:program-v7` | À faire | Idempotent ; 1 program + 4 sessions + N exos + prescribed_sets cohérents |
| D | Setup wizard exercices (+ override RPE) | À faire | UI permet ajout/réordonnement ; validation supersets |
| E | Saisie initiale 1RM | À faire | 1 ligne `exercise_1rm_history` par compound ; suggested weight correct |
| F | Live screen séance | À faire | Démarrer Pull A → set 1 bench → log → timer 120s → set 2 affiché |
| G | Supersets fonctionnels | À faire | Timer 15s intra-paire, 90s inter-paire ; `rest_seconds_actual` mesuré |
| H | Dashboard radar 6 stats | À faire | 0 séance → vitalité 0 ; 16 sessions → vitalité 10 ; 5 axes à 0 |
| I | Test mobile gym | À faire | Séance Pull A complète sans bug, latence <100ms perçue |
| J | Résilience réseau | À faire | Wifi off → 3 sets loggués → wifi on → 3 sets en DB |
