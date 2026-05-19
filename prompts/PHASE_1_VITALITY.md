# Phase 1 — Vitality tracker

Goal: tracker de musculation fidèle au programme v7 du owner (4 séances/sem, pyramide 70/85/100% sur 3 compounds d'ouverture, charges constantes sur isolations, supersets antagonistes paire d'isolations), avec dashboard radar 6 stats dont seul l'axe Vitalité est calculé (les 5 autres seront peuplés par les phases suivantes).

Owner = user avancé (3 ans entraînement, tracking RHR longitudinal). UX mobile-first, consultation en séance.

---

## Décisions structurelles validées

Voir [PROGRESS.md](../PROGRESS.md#2026-05-19--bootstrap-du-projet-phase-1--vitality) — décisions D1 à D14.

## Hors scope Phase 1

- Quêtes / achievements (Phase 8)
- Coach LLM (Phase 7)
- Détection auto des PR (Phase 3)
- Saisie RHR / Z2 dédiée (Phase 2)
- Offline / Dexie / Serwist (Phase 9)
- Vision (Phase 4)
- Nutrition (Phase 5)
- Crons / webhooks (Phase 6)

---

## Liste des prompts (étapes A → J)

### Prompt #1 — Bootstrap (✅ fait 2026-05-19)
Init Next.js 16 + Supabase deps + structure repo + déplacement fichier source + PROGRESS.md.

### Prompt #2 — Étape A : schémas DB
Rédiger la migration `supabase/migrations/20260519172500_init_schema.sql` (8 tables, RLS, enums, triggers).
**Critère** : `\d` dans psql liste 8 tables ; insert anon refusé ; insert authenticated OK sur sa propre data uniquement.
**Statut** : SQL rédigé, en attente review owner avant apply.

### Prompt #3 — Étape B : seed `exercises`
Créer `supabase/migrations/20260519XXXXXX_seed_exercises.sql` (ou script seed) avec les 29 exercices uniques du programme v7.
**Critère** : `SELECT count(*) FROM exercises WHERE user_id = ...` = 29.

### Prompt #4 — Étape C : script `import:program-v7`
Parser `data/import/program-v7-exercises.md` → INSERT cohérent dans `programs`, `program_sessions`, `program_exercises`, `prescribed_sets`.
**Critère** : `npm run import:program-v7` idempotent (re-run → 0 doublons). Validation supersets bloque si même `primary_muscle`. RPE target peuplé.

### Prompt #5 — Étape D : setup wizard programmation
Page `/setup/program` : permet réordre, override RPE par set, override `rest_seconds`, override `working_weight_kg` (avant ou en complément du 1RM screen).
**Critère** : modif persistée, validation supersets côté serveur.

### Prompt #6 — Étape E : saisie initiale 1RM
Page `/setup/1rm` : saisie manuelle 1RM pour chaque compound présent dans `program_exercises`. Insert dans `exercise_1rm_history`.
**Critère** : 1RM bench 100 → working weight 0.825 × 100 = 82.5 kg → set 2 affiché à 85% × 82.5 = round_2_5(70.1) = 70 kg.

### Prompt #7 — Étape F : live screen séance (compounds + isolations)
Page `/workout/[sessionId]` : Server Component fetch initial JOIN + Client Component avec TanStack Query, timer, optimistic mutation.
**Critère** : démarrer Pull A → set 1 bench suggéré → log → timer 120s démarre → set 2 affiché à 85%. Test sur throttling Slow 4G : UI bascule en <100ms perçu.

### Prompt #8 — Étape G : supersets
Affichage paire A/B, timer 15s intra, 90s inter. `rest_seconds_actual` mesuré et persisté.
**Critère** : séance Push A → SS-A (élév lat + triceps corde) → tour 1 A → timer 15s → tour 1 B → timer 90s → tour 2 A.

### Prompt #9 — Étape H : dashboard radar 6 stats
Page `/dashboard` : radar avec 6 axes (Vitalité calculée + 5 placeholders à 0). Formule : `MIN(10, sessions_28j × 10 / 16)`.
**Critère** : DB vide → Vitalité = 0. 16 sessions complétées en 28j → Vitalité = 10. 8 sessions → 5.

### Prompt #10 — Étape I : test mobile gym
Test manuel sur iPhone en conditions réelles (Fitness Park République). Vidéo de la séance complète.
**Critère** : pas de zoom involontaire, timer audible casque BT, latence perçue zéro.

### Prompt #11 — Étape J : résilience réseau
Désactiver wifi en plein milieu, logger 3 sets, réactiver wifi, vérifier que les 3 sets sont en DB.
**Critère** : 100% des sets arrivent en DB (via TanStack Query retry exp backoff).
