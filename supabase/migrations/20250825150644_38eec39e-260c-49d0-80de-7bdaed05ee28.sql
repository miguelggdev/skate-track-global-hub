
-- 1) Eliminar cualquier restricción única existente sobre (training_session_id, athlete_id)
DO $$
DECLARE
  cons RECORD;
BEGIN
  FOR cons IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.training_attendance'::regclass
      AND c.contype IN ('u','x')
      AND (
        SELECT array_agg(att.attname ORDER BY att.attnum)
        FROM unnest(c.conkey) AS colnum
        JOIN pg_attribute att
          ON att.attrelid = c.conrelid AND att.attnum = colnum
      ) = ARRAY['training_session_id','athlete_id']
  LOOP
    EXECUTE format('ALTER TABLE public.training_attendance DROP CONSTRAINT IF EXISTS %I', cons.conname);
  END LOOP;
END
$$;

-- 2) Crear la restricción única con nombre estable
ALTER TABLE public.training_attendance
  ADD CONSTRAINT training_attendance_unique_session_athlete
  UNIQUE (training_session_id, athlete_id);

-- 3) Añadir claves foráneas si faltan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'training_attendance_training_session_fk'
  ) THEN
    ALTER TABLE public.training_attendance
      ADD CONSTRAINT training_attendance_training_session_fk
      FOREIGN KEY (training_session_id)
      REFERENCES public.training_sessions(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'training_attendance_athlete_fk'
  ) THEN
    ALTER TABLE public.training_attendance
      ADD CONSTRAINT training_attendance_athlete_fk
      FOREIGN KEY (athlete_id)
      REFERENCES public.athletes(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

-- 4) Crear el trigger de validación de 48h si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'validate_attendance_edit_time_limit'
  ) THEN
    CREATE TRIGGER validate_attendance_edit_time_limit
      BEFORE UPDATE ON public.training_attendance
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_edit_time_limit();
  END IF;
END
$$;

-- 5) Función RPC: upsert explícito nombrando la restricción
CREATE OR REPLACE FUNCTION public.upsert_training_attendance(
  p_training_session_id uuid,
  p_athlete_id uuid,
  p_attended boolean DEFAULT true,
  p_performance_rating integer DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.training_attendance
LANGUAGE sql
AS $func$
  INSERT INTO public.training_attendance (
    training_session_id, athlete_id, attended, performance_rating, notes
  )
  VALUES (
    p_training_session_id, p_athlete_id, COALESCE(p_attended, true), p_performance_rating, p_notes
  )
  ON CONFLICT ON CONSTRAINT training_attendance_unique_session_athlete
  DO UPDATE SET
    attended = EXCLUDED.attended,
    performance_rating = EXCLUDED.performance_rating,
    notes = EXCLUDED.notes
  RETURNING *;
$func$;

-- 6) Función RPC en bulk para múltiples atletas en una sola llamada
-- Espera un JSON array con objetos que tengan: training_session_id, athlete_id, attended, performance_rating, notes
CREATE OR REPLACE FUNCTION public.upsert_training_attendance_bulk(p_rows jsonb)
RETURNS SETOF public.training_attendance
LANGUAGE plpgsql
AS $func$
DECLARE
  r jsonb;
  rec public.training_attendance;
BEGIN
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    INSERT INTO public.training_attendance (
      training_session_id, athlete_id, attended, performance_rating, notes
    )
    VALUES (
      (r->>'training_session_id')::uuid,
      (r->>'athlete_id')::uuid,
      COALESCE((r->>'attended')::boolean, true),
      NULLIF(r->>'performance_rating','')::int,
      NULLIF(r->>'notes','')::text
    )
    ON CONFLICT ON CONSTRAINT training_attendance_unique_session_athlete
    DO UPDATE SET
      attended = EXCLUDED.attended,
      performance_rating = EXCLUDED.performance_rating,
      notes = EXCLUDED.notes
    RETURNING * INTO rec;

    RETURN NEXT rec;
  END LOOP;

  RETURN;
END;
$func$;

-- 7) Conceder EXECUTE a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.upsert_training_attendance(uuid, uuid, boolean, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_training_attendance_bulk(jsonb) TO authenticated;

-- Verificación rápida (opcional): listar la restricción
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'public.training_attendance'::regclass;
