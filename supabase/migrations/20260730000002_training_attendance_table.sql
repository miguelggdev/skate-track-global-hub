-- =============================================================
-- CREATE training_attendance TABLE
-- The frontend uses this table extensively with an `attended`
-- boolean column. Only the old `attendance` table (with `status`
-- text column) existed. This migration creates the expected table
-- and migrates existing attendance data.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.training_attendance (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  athlete_id          uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  attended            boolean NOT NULL DEFAULT true,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_session_id, athlete_id)
);

-- Migrate data from legacy attendance table
INSERT INTO public.training_attendance (
  id, training_session_id, athlete_id, attended, notes, created_at
)
SELECT
  id,
  session_id,
  athlete_id,
  status != 'absent',
  notes,
  recorded_at
FROM public.attendance
ON CONFLICT (training_session_id, athlete_id) DO NOTHING;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_ta_training_session ON public.training_attendance(training_session_id);
CREATE INDEX IF NOT EXISTS idx_ta_athlete_id       ON public.training_attendance(athlete_id);
CREATE INDEX IF NOT EXISTS idx_ta_attended         ON public.training_attendance(athlete_id, attended) WHERE attended = true;
CREATE INDEX IF NOT EXISTS idx_ta_created_at       ON public.training_attendance(created_at DESC);

-- RLS
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches and admins manage all attendance"
  ON public.training_attendance
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'coach') OR
    has_role(auth.uid(), 'leader')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'coach') OR
    has_role(auth.uid(), 'leader')
  );

CREATE POLICY "Athletes view own attendance"
  ON public.training_attendance
  FOR SELECT
  TO authenticated
  USING (
    athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  );
