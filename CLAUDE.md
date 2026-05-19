@AGENTS.md

# coach-lifestyle — contexte projet

App perso de suivi multi-domaines (force, vitalité, nutrition, vision, coach LLM). MVP solo, owner = Baptiste.

## Stack figée
- **Next.js 16.2.6** (App Router, Server Components par défaut, Server Actions pour les mutations). Choix figé 2026-05-19. Toute syntaxe utilisée doit être celle de Next 16 — pas de mix avec Next 15. AGENTS.md auto-généré pointe les breaking changes ; relire `node_modules/next/dist/docs/` au moindre doute.
- **Supabase** : Postgres + Auth (magic link) + RLS dès J1. Migrations dans `supabase/migrations/`. Types TS générés via `supabase gen types typescript`.
- **TanStack Query** : cache client + mutations optimistes (latence saisie gym masquée).
- **Tailwind 4** + shadcn/ui à init si besoin.
- **Zod** : schémas de validation côté server actions.
- **Vercel** : déploiement.
- **PAS de Dexie / sql.js / Serwist en Phase 1** — Phase 9 ajoutera l'offline.

## Conventions
- Mutations = Server Actions (`"use server"`), pas de Route Handlers en Phase 1.
- Tous les fetchs initiaux dans Server Components — un seul JOIN au mount par page interactive.
- Mutations client → TanStack Query `useMutation` avec `onMutate` pour optimistic UI.
- Pas d'API routes (`app/api/*`) sauf Phase 2+ (crons, webhooks externes).
- RLS systématique : `auth.uid() = user_id` sur toutes les tables.
- Migrations SQL versionnées, pas d'ORM (Drizzle/Prisma) pour rester proche de Supabase natif.

## Règles d'écriture
- Communication style owner : dense, structuré, analytique, peu de prose.
- Pas d'emojis sauf demande explicite.
- Pas de commentaires WHAT, seulement WHY non-évident.
- Pas de docs/README générés sans demande.
- Pas de refactor surfacique en bonus.

## Structure repo — single-app

Single-app Next.js, **pas de monorepo** en Phase 1-8. Refactor monorepo (Turborepo ou équivalent) prévu en Phase 9 si nécessaire — quand `apps/sync` (Amazfit) sera ajouté. Décidé 2026-05-19.

```
coach-lifestyle/
├── app/                    # App Router pages — racine, pas de src/
├── components/             # UI shadcn/ui + custom
├── lib/                    # logique métier, clients externes, queries
│   ├── coach/              # Phase 6+ — Anthropic client, prompts coach
│   ├── vision/             # Phase 4 — analyse photo repas
│   ├── workout-engine/     # Phase 3 — calculs 1RM, volume, PR detection
│   └── gamification/       # Phase 5+ — XP, quêtes, achievements
├── supabase/migrations/    # SQL versionnés
├── scripts/                # seed, import (npm run import:program-v7, etc.)
├── data/import/            # sources d'import (programme v7, profil santé)
├── docs/                   # docs métier (formules vitalité, conventions, etc.)
├── prompts/                # briefs par phase pour Claude Code
├── PROGRESS.md             # journal des décisions et avancement
├── CLAUDE.md               # ce fichier
└── .env.local              # racine (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, ANTHROPIC_API_KEY)
```

Path alias TS : `@/*` → `./*` (racine, pas `src/`).

## Lien Obsidian
Le vault `/Users/baptiste/Documents/Obsidian Vault/50_Projets_perso/` contiendra un `_index.md` pour ce projet (cohérence avec aura-io). À créer plus tard.

## Profil owner (résumé pour décisions de coaching futures)
- 3 ans d'entraînement, programme structuré v7
- Tracking RHR longitudinal (cible 55, baseline 72)
- Style data-driven, analytique, communication dense
- Délègue la programmation mais conteste les changements silencieux de paramètres structurels (cf. retrait pyramidal en v6)
- Source détaillée : `data/import/health-profile-export.json` (à copier depuis `~/Downloads/` quand on en aura besoin)
