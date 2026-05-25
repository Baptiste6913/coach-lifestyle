-- ============================================================================
-- exercises: passer de user-scoped → table de référence publique
-- Date: 2026-05-25
--
-- Correction de design (D19 dans PROGRESS.md) : exercises est une donnée
-- de référence partagée, pas user-scoped. Les 29 exos du programme v7 sont
-- les mêmes pour tous les users.
--
-- Si Phase 7+ veut permettre des exos custom par user, ajouter colonne
-- created_by UUID NULL + policy adaptée. Pas pour Phase 1.
--
-- Sécurité : DROP COLUMN user_id, DROP CASCADE n'est PAS utilisé car aucune
-- autre table ne FK sur exercises.user_id (les FK pointent sur exercises.id,
-- pas sur user_id) — vérifié manuellement.
-- ============================================================================

-- 1. Drop policy user-scopée
DROP POLICY IF EXISTS exercises_owner_all ON exercises;

-- 2. Drop contrainte unique composite (user_id, slug) et son index automatique
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_user_id_slug_key;

-- 3. Drop index user-scopé
DROP INDEX IF EXISTS exercises_user_category_idx;

-- 4. Drop FK puis colonne user_id
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_user_id_fkey;
ALTER TABLE exercises DROP COLUMN IF EXISTS user_id;

-- 5. Recréer la contrainte unique sur slug seul
ALTER TABLE exercises ADD CONSTRAINT exercises_slug_key UNIQUE (slug);

-- 6. Index sur category pour les requêtes de filtrage
CREATE INDEX exercises_category_idx ON exercises (category);

-- 7. RLS reste activée (héritée de la migration init) — on ajoute uniquement
--    une policy SELECT publique pour les users authentifiés.
--    AUCUNE policy INSERT/UPDATE/DELETE → opérations write réservées
--    au service_role (utilisé pour le seed via script).
CREATE POLICY exercises_public_read ON exercises
  FOR SELECT TO authenticated
  USING (true);
