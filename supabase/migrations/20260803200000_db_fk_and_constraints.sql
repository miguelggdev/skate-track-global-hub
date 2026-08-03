-- ============================================================
-- DB FK fixes — 2026-08-03
-- ============================================================

-- ── F-1: financial_transactions.athlete_id — ON DELETE SET NULL → RESTRICT ───
-- Con SET NULL, borrar un atleta deja las transacciones sin referencia (pérdida
-- de historial de pagos). RESTRICT previene borrar atletas con transacciones.

DO $$
DECLARE
  v_constraint_name text;
BEGIN
  -- Buscar el nombre actual de la FK constraint
  SELECT tc.constraint_name
    INTO v_constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = 'financial_transactions'
     AND tc.constraint_type = 'FOREIGN KEY'
     AND kcu.column_name = 'athlete_id'
   LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.financial_transactions DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END;
$$;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT fk_financial_transactions_athlete_id
  FOREIGN KEY (athlete_id)
  REFERENCES public.athletes(id)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;


-- ── F-2: document_signatures.document_id — añadir FK a documents(id) ─────────
-- No había FK; se podían crear firmas huérfanas apuntando a documentos inexistentes.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'document_signatures'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'document_id'
    ) THEN
      ALTER TABLE public.document_signatures
        ADD CONSTRAINT fk_document_signatures_document_id
        FOREIGN KEY (document_id)
        REFERENCES public.documents(id)
        ON DELETE CASCADE
        NOT VALID;

      ALTER TABLE public.document_signatures
        VALIDATE CONSTRAINT fk_document_signatures_document_id;
    END IF;
  END IF;
END;
$$;


-- ── F-3: transactions (tabla legacy) — alinear RLS con financial_transactions ─
-- La tabla legacy sigue activa con políticas RLS divergentes.
-- La solución conservadora es restringirla a service_role solamente.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    -- Eliminar políticas existentes
    DROP POLICY IF EXISTS "Authenticated read transactions" ON public.transactions;
    DROP POLICY IF EXISTS "Admin manage transactions" ON public.transactions;
    DROP POLICY IF EXISTS "Users read own transactions" ON public.transactions;

    -- Solo service_role puede acceder (la app usa financial_transactions)
    ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.transactions FROM authenticated, anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO service_role;
  END IF;
END;
$$;
