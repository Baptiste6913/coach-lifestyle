-- ============================================================================
-- Seed des 28 exercices uniques du programme v7
-- Date: 2026-05-25
--
-- 12 compounds + 16 isolations.
-- Face Pulls dédupliqué (apparaît Pull A et Pull B avec le même slug).
-- Pullover câble corde + Écarté poulie haute = isolation biomécanique
--   (single-joint), is_pyramidal=true sera porté par program_exercises.
-- ON CONFLICT (slug) DO NOTHING : idempotent, re-run safe.
-- ============================================================================

INSERT INTO exercises (slug, name, category, primary_muscle, secondary_muscles, equipment) VALUES

-- ====== PULL A ======
('tirage-vertical-prise-neutre',
 'Tirage vertical prise neutre',
 'compound', 'back-lats',
 '["back-mid", "biceps"]'::jsonb, 'technogym-sel'),

('rowing-hammer-strength-unilateral',
 'Rowing Hammer Strength unilatéral',
 'compound', 'back-lats',
 '["back-mid", "biceps"]'::jsonb, 'hammer-plate'),

('tirage-horizontal-cable-poitrine',
 'Tirage horizontal câble poitrine',
 'compound', 'back-mid',
 '["back-lats", "biceps"]'::jsonb, 'cable'),

('curl-barre-ez',
 'Curl barre EZ',
 'isolation', 'biceps',
 '["brachialis", "forearms"]'::jsonb, 'ez-bar'),

('face-pulls',
 'Face Pulls (câble haut)',
 'isolation', 'back-rear-delt',
 '["back-mid"]'::jsonb, 'cable'),

('curl-incline-halteres',
 'Curl incliné haltères',
 'isolation', 'biceps',
 '["brachialis"]'::jsonb, 'dumbbell'),

('rear-delt-fly-pec-deck',
 'Rear Delt Fly (pec deck inversé)',
 'isolation', 'back-rear-delt',
 '["back-mid"]'::jsonb, 'technogym-sel'),

-- ====== PUSH A ======
('developpe-couche-halteres',
 'Développé couché haltères',
 'compound', 'chest',
 '["shoulders-front", "triceps"]'::jsonb, 'dumbbell'),

('developpe-militaire-hammer-strength',
 'Développé militaire Hammer Strength',
 'compound', 'shoulders-front',
 '["triceps", "shoulders-side"]'::jsonb, 'hammer-plate'),

('dips-lestes',
 'Dips lestés (ou machine)',
 'compound', 'chest',
 '["triceps", "shoulders-front"]'::jsonb, 'bodyweight'),

('pec-deck',
 'Pec Deck',
 'isolation', 'chest',
 '["shoulders-front"]'::jsonb, 'technogym-sel'),

('elevations-laterales-halteres',
 'Élévations latérales haltères',
 'isolation', 'shoulders-side',
 '[]'::jsonb, 'dumbbell'),

('extensions-triceps-corde',
 'Extensions triceps corde',
 'isolation', 'triceps',
 '[]'::jsonb, 'cable'),

('elevations-laterales-cable-unilateral',
 'Élévations latérales câble (1 bras)',
 'isolation', 'shoulders-side',
 '[]'::jsonb, 'cable'),

('pushdown-triceps-barre-v',
 'Pushdown triceps barre V',
 'isolation', 'triceps',
 '[]'::jsonb, 'cable'),

-- ====== PULL B ======
('tractions-lestees',
 'Tractions lestées (ou assistées)',
 'compound', 'back-lats',
 '["biceps", "back-mid"]'::jsonb, 'bodyweight'),

('rowing-barre-t',
 'Rowing barre T',
 'compound', 'back-mid',
 '["back-lats", "biceps"]'::jsonb, 'barbell'),

('pullover-cable-corde',
 'Pullover câble corde',
 'isolation', 'back-lats',
 '["chest", "triceps"]'::jsonb, 'cable'),

('high-cable-curls',
 'High Cable Curls',
 'isolation', 'biceps',
 '[]'::jsonb, 'cable'),

('curl-marteau-corde',
 'Curl marteau corde',
 'isolation', 'brachialis',
 '["biceps", "forearms"]'::jsonb, 'cable'),

('cable-crunches-genoux',
 'Cable Crunches (à genoux)',
 'isolation', 'abs',
 '["obliques"]'::jsonb, 'cable'),

-- ====== PUSH B ======
('developpe-couche-incline-barre',
 'Développé couché incliné barre',
 'compound', 'chest',
 '["shoulders-front", "triceps"]'::jsonb, 'barbell'),

('developpe-epaules-halteres-assis',
 'Développé épaules haltères assis',
 'compound', 'shoulders-front',
 '["triceps", "shoulders-side"]'::jsonb, 'dumbbell'),

('ecarte-poulie-haute-pec-inferieur',
 'Écarté poulie haute (pec inférieur)',
 'isolation', 'chest',
 '["shoulders-front"]'::jsonb, 'cable'),

('elevations-laterales-machine',
 'Élévations latérales machine',
 'isolation', 'shoulders-side',
 '[]'::jsonb, 'technogym-sel'),

('skull-crushers-ez',
 'Skull Crushers EZ',
 'isolation', 'triceps',
 '[]'::jsonb, 'ez-bar'),

('elevations-frontales-halteres',
 'Élévations frontales haltères',
 'isolation', 'shoulders-front',
 '[]'::jsonb, 'dumbbell'),

('dips-machine-triceps',
 'Dips machine (triceps focus)',
 'isolation', 'triceps',
 '["chest", "shoulders-front"]'::jsonb, 'technogym-sel')

ON CONFLICT (slug) DO NOTHING;
