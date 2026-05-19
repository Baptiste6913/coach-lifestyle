-- ============================================================================
-- Phase 1 — Initial schema for coach-lifestyle (Vitality tracker)
-- Date: 2026-05-19
--
-- 8 tables, all per-user with RLS:
--   exercises, programs, program_sessions, program_exercises,
--   prescribed_sets, exercise_1rm_history, workout_sessions, exercise_sets
--
-- Design notes:
--   - Orthogonalized program_exercises: is_pyramidal + superset_group +
--     superset_position (no enum 'role') — allows "isolation pyramidée" cases.
--   - prescribed_sets is explicit (1 row per prescribed set), not derived.
--   - RLS enforced from day 1 even though solo user (futureproof).
--   - Antagonist supersets validation is APP-LEVEL (primary_muscle differs,
--     not both compounds) — not enforced by DB constraints because it would
--     require cross-row checks. Script d'import + setup wizard valident.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE exercise_category AS ENUM ('compound', 'isolation');
CREATE TYPE workout_status    AS ENUM ('in_progress', 'completed', 'abandoned');

-- ---------------------------------------------------------------------------
-- Shared trigger function: updated_at = now()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- TABLE: exercises (catalogue, per-user en Phase 1)
-- ===========================================================================
CREATE TABLE exercises (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL,
  name              TEXT NOT NULL,
  category          exercise_category NOT NULL,
  primary_muscle    TEXT NOT NULL,
  secondary_muscles JSONB NOT NULL DEFAULT '[]'::jsonb,
  equipment         TEXT NULL,
  video_url         TEXT NULL,
  notes             TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX exercises_user_category_idx ON exercises (user_id, category);

CREATE TRIGGER trg_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY exercises_owner_all ON exercises
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- TABLE: programs
-- ===========================================================================
CREATE TABLE programs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  version             SMALLINT NOT NULL,
  phase               TEXT NULL,
  frequency_per_week  SMALLINT NOT NULL CHECK (frequency_per_week BETWEEN 1 AND 14),
  duration_weeks      SMALLINT NULL,
  started_at          DATE NULL,
  raw_text            TEXT NULL,
  protected_params    JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes               TEXT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, version)
);

CREATE TRIGGER trg_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY programs_owner_all ON programs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- TABLE: program_sessions
-- ===========================================================================
CREATE TABLE program_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id         UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,            -- "Pull A", "Push A", "Pull B", "Push B"
  day_of_week        SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=lundi
  order_index        SMALLINT NOT NULL,
  target_sets_total  SMALLINT NULL,            -- annoncé par le programme (18/18/18/16)
  notes              TEXT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_id, name),
  UNIQUE (program_id, order_index)
);

CREATE INDEX program_sessions_program_idx ON program_sessions (program_id);

ALTER TABLE program_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY program_sessions_owner_all ON program_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- TABLE: program_exercises (orthogonalized)
-- ===========================================================================
CREATE TABLE program_exercises (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_session_id    UUID NOT NULL REFERENCES program_sessions(id) ON DELETE CASCADE,
  exercise_id           UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  order_index           SMALLINT NOT NULL,
  is_pyramidal          BOOLEAN NOT NULL DEFAULT false,
  superset_group        CHAR(1) NULL,           -- 'A', 'B', NULL
  superset_position     SMALLINT NULL,          -- 1 ou 2 dans la paire
  target_sets           SMALLINT NOT NULL CHECK (target_sets > 0),
  target_reps_low       SMALLINT NOT NULL CHECK (target_reps_low > 0),
  target_reps_high      SMALLINT NOT NULL,
  rest_seconds_override SMALLINT NULL CHECK (rest_seconds_override IS NULL OR rest_seconds_override > 0),
  working_weight_kg     NUMERIC(6,2) NULL CHECK (working_weight_kg IS NULL OR working_weight_kg > 0),
  warmup_protocol       TEXT NULL,
  execution_cues        TEXT NULL,
  notes                 TEXT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_session_id, order_index),
  CONSTRAINT pe_reps_range CHECK (target_reps_low <= target_reps_high),
  CONSTRAINT pe_ss_consistent CHECK (
    (superset_group IS NULL AND superset_position IS NULL)
    OR (superset_group IN ('A','B') AND superset_position IN (1,2))
  )
);

CREATE INDEX program_exercises_session_idx  ON program_exercises (program_session_id);
CREATE INDEX program_exercises_exercise_idx ON program_exercises (exercise_id);

ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY program_exercises_owner_all ON program_exercises
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- TABLE: prescribed_sets (1 ligne = 1 set prescrit)
-- ===========================================================================
CREATE TABLE prescribed_sets (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_exercise_id    UUID NOT NULL REFERENCES program_exercises(id) ON DELETE CASCADE,
  set_index              SMALLINT NOT NULL CHECK (set_index > 0),
  target_pct_of_working  NUMERIC(4,3) NOT NULL CHECK (target_pct_of_working > 0 AND target_pct_of_working <= 1.500),
  target_reps_low        SMALLINT NOT NULL CHECK (target_reps_low > 0),
  target_reps_high       SMALLINT NOT NULL,
  rpe_target             NUMERIC(3,1) NULL CHECK (rpe_target IS NULL OR (rpe_target >= 1 AND rpe_target <= 10)),
  is_warmup              BOOLEAN NOT NULL DEFAULT false,   -- true pour pyramide sets 1+2
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_exercise_id, set_index),
  CONSTRAINT ps_reps_range CHECK (target_reps_low <= target_reps_high)
);

ALTER TABLE prescribed_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY prescribed_sets_owner_all ON prescribed_sets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- TABLE: exercise_1rm_history (série temporelle)
-- ===========================================================================
CREATE TABLE exercise_1rm_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  one_rm_kg   NUMERIC(6,2) NOT NULL CHECK (one_rm_kg > 0),
  estimated   BOOLEAN NOT NULL DEFAULT false,    -- Phase 1: false (manuel). Phase 3: true via Epley.
  source      TEXT NOT NULL DEFAULT 'manual',
  valid_from  DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to    DATE NULL,
  notes       TEXT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_rm_validity CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE INDEX exercise_1rm_history_lookup_idx
  ON exercise_1rm_history (user_id, exercise_id, valid_from DESC);

ALTER TABLE exercise_1rm_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY exercise_1rm_history_owner_all ON exercise_1rm_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- TABLE: workout_sessions (séances réellement faites)
-- ===========================================================================
CREATE TABLE workout_sessions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_session_id       UUID NULL REFERENCES program_sessions(id) ON DELETE SET NULL,
  session_date             DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at                 TIMESTAMPTZ NULL,
  bodyweight_kg            NUMERIC(5,2) NULL CHECK (bodyweight_kg IS NULL OR bodyweight_kg > 0),
  pre_workout_caffeine_mg  SMALLINT NULL CHECK (pre_workout_caffeine_mg IS NULL OR pre_workout_caffeine_mg >= 0),
  pre_workout_rhr_bpm      SMALLINT NULL CHECK (pre_workout_rhr_bpm IS NULL OR (pre_workout_rhr_bpm BETWEEN 30 AND 200)),
  subjective_energy_1_10   SMALLINT NULL CHECK (subjective_energy_1_10 IS NULL OR (subjective_energy_1_10 BETWEEN 1 AND 10)),
  status                   workout_status NOT NULL DEFAULT 'in_progress',
  notes                    TEXT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ws_end_after_start CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX workout_sessions_user_date_idx
  ON workout_sessions (user_id, session_date DESC);
CREATE INDEX workout_sessions_program_idx
  ON workout_sessions (program_session_id) WHERE program_session_id IS NOT NULL;

CREATE TRIGGER trg_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY workout_sessions_owner_all ON workout_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================================================
-- TABLE: exercise_sets (sets réellement effectués)
-- ===========================================================================
CREATE TABLE exercise_sets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_session_id    UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  program_exercise_id   UUID NULL REFERENCES program_exercises(id) ON DELETE SET NULL,
  prescribed_set_id     UUID NULL REFERENCES prescribed_sets(id) ON DELETE SET NULL,
  exercise_id           UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  set_index             SMALLINT NOT NULL CHECK (set_index > 0),
  weight_kg             NUMERIC(6,2) NOT NULL CHECK (weight_kg >= 0),
  reps                  SMALLINT NOT NULL CHECK (reps >= 0),
  rpe                   NUMERIC(3,1) NULL CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  rest_seconds_actual   SMALLINT NULL CHECK (rest_seconds_actual IS NULL OR rest_seconds_actual >= 0),
  completed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes                 TEXT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX exercise_sets_session_idx       ON exercise_sets (workout_session_id, completed_at);
CREATE INDEX exercise_sets_last_lift_idx     ON exercise_sets (user_id, exercise_id, completed_at DESC);
CREATE INDEX exercise_sets_program_exo_idx   ON exercise_sets (program_exercise_id) WHERE program_exercise_id IS NOT NULL;
CREATE INDEX exercise_sets_prescribed_idx    ON exercise_sets (prescribed_set_id)   WHERE prescribed_set_id IS NOT NULL;

ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY exercise_sets_owner_all ON exercise_sets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
