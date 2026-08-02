-- ════════════════════════════════════════════════════════════════════
-- Sprint 7 — Módulo médico completo + Firma digital
-- Tablas: vaccine_records, physical_fitness_tests, document_signatures
-- ════════════════════════════════════════════════════════════════════

-- ── vaccine_records ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vaccine_records (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id     uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  vaccine_name   text        NOT NULL,
  dose_number    text,
  vaccine_date   date        NOT NULL,
  expiry_date    date,
  provider       text,
  lot_number     text,
  notes          text,
  created_at     timestamptz DEFAULT now(),
  created_by     uuid        REFERENCES auth.users(id)
);

ALTER TABLE public.vaccine_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and coaches manage vaccines"
  ON public.vaccine_records
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

-- Padres ven vacunas de sus hijos vinculados
CREATE POLICY "Parents view their athlete vaccines"
  ON public.vaccine_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_athletes
      WHERE parent_athletes.parent_user_id = auth.uid()
        AND parent_athletes.athlete_id = vaccine_records.athlete_id
    )
  );

CREATE INDEX idx_vaccine_records_athlete_id ON public.vaccine_records(athlete_id);

-- ── physical_fitness_tests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.physical_fitness_tests (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id      uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  test_date       date        NOT NULL,
  evaluator       text,
  -- Composición corporal
  weight_kg       numeric(5,2),
  height_cm       numeric(5,1),
  body_fat_pct    numeric(4,1),
  -- Cardiovascular
  resting_hr      integer,
  max_hr          integer,
  vo2max          numeric(5,2),
  -- Flexibilidad
  flexibility_cm  numeric(5,1),
  -- Fuerza (kg)
  leg_press_kg    numeric(6,2),
  bench_press_kg  numeric(6,2),
  plank_sec       integer,
  -- Velocidad / Agilidad
  sprint_30m_sec  numeric(5,3),
  -- Resistencia
  cooper_m        integer,
  -- Notas libres
  notes           text,
  created_at      timestamptz DEFAULT now(),
  created_by      uuid        REFERENCES auth.users(id)
);

ALTER TABLE public.physical_fitness_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and coaches manage fitness tests"
  ON public.physical_fitness_tests
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'coach'));

CREATE POLICY "Athletes view own fitness tests"
  ON public.physical_fitness_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.athletes
      WHERE athletes.id = physical_fitness_tests.athlete_id
        AND athletes.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents view their athlete fitness tests"
  ON public.physical_fitness_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_athletes
      WHERE parent_athletes.parent_user_id = auth.uid()
        AND parent_athletes.athlete_id = physical_fitness_tests.athlete_id
    )
  );

CREATE INDEX idx_fitness_tests_athlete_id ON public.physical_fitness_tests(athlete_id);

-- ── document_signatures ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.document_signatures (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id     uuid,       -- opcional: FK blanda hacia documents
  signer_user_id  uuid        REFERENCES auth.users(id),
  signer_name     text        NOT NULL,
  signer_role     text,
  document_title  text        NOT NULL,
  signature_data  text        NOT NULL, -- base64 PNG
  signed_at       timestamptz DEFAULT now()
);

ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signers manage own signatures"
  ON public.document_signatures
  USING (signer_user_id = auth.uid())
  WITH CHECK (signer_user_id = auth.uid());

CREATE POLICY "Admins view all signatures"
  ON public.document_signatures FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_doc_signatures_document_id ON public.document_signatures(document_id);
CREATE INDEX idx_doc_signatures_signer     ON public.document_signatures(signer_user_id);
