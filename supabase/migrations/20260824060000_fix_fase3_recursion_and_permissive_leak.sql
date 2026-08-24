-- =============================================================
-- HOTFIX de la Fase 3 (multi-tenant), detectado en vivo inmediatamente
-- después de aplicarla — dos bugs reales, no teóricos:
--
-- 1. "infinite recursion detected in policy for relation athletes"
--    (42P17). `athletes` ya tenía una policy PERMISSIVE preexistente
--    ("Parent views linked athlete") que hace un subselect sobre
--    `parent_athletes`. La Fase 3 le agregó a `parent_athletes` una
--    policy que hace EXISTS sobre `athletes`. Evaluar athletes ->
--    evalúa parent_athletes (su propio RLS) -> evalúa athletes de
--    nuevo -> bucle infinito. Se rompe dándole a parent_athletes su
--    propio club_id (deja de necesitar el EXISTS sobre athletes).
--    coach_athletes NO tiene este problema (ninguna policy de `coaches`
--    ni `athletes` lo referencia) — se deja con herencia normal.
--
-- 2. Las policies "hereda_de_padre" de la Fase 3 se crearon PERMISSIVE
--    (igual que el ejemplo del manual §4.6), pero varias tablas hija acá
--    YA tenían una policy PERMISSIVE preexistente de "cualquier
--    autenticado puede ver" (qual = true) — ej. relay_teams,
--    competition_registrations. Con dos PERMISSIVE se combinan por OR,
--    así que la de "true" gana y el aislamiento por club NO se aplicaba
--    de verdad (se verificó: las 19 tablas del Grupo C ya tenían entre 1
--    y 3 policies PERMISSIVE propias antes de la Fase 3 — ninguna
--    dependía exclusivamente de la policy heredada, así que no hay
--    riesgo de "subárbol ciego" al pasarla a RESTRICTIVE). Se corrige
--    recreando todas como RESTRICTIVE (coherente con la Fase 2 y con el
--    principio del plan: RESTRICTIVE es la capa que se agrega ENCIMA de
--    las policies de rol, no una alternativa a ellas).
-- =============================================================

-- ── Fix 1: parent_athletes gana su propio club_id, deja de heredar por EXISTS ──

DROP POLICY IF EXISTS inherit_parent_athletes ON public.parent_athletes;

ALTER TABLE public.parent_athletes ADD COLUMN club_id uuid REFERENCES public.clubs(id);
UPDATE public.parent_athletes SET club_id = public.default_club_id() WHERE club_id IS NULL;
ALTER TABLE public.parent_athletes ALTER COLUMN club_id SET NOT NULL;
CREATE INDEX idx_parent_athletes_club_id ON public.parent_athletes (club_id);

CREATE TRIGGER trg_set_club_id BEFORE INSERT ON public.parent_athletes
  FOR EACH ROW EXECUTE FUNCTION public.set_club_id_from_current_user();

CREATE POLICY tenant_isolation ON public.parent_athletes
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.same_club(club_id))
  WITH CHECK (public.same_club(club_id));

-- ── Fix 2: recrear _policy_hereda_de_padre como RESTRICTIVE ──

CREATE OR REPLACE FUNCTION public._policy_hereda_de_padre(
  p_hija TEXT, p_fk TEXT, p_padre TEXT, p_pk TEXT DEFAULT 'id'
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE v_nombre TEXT := 'inherit_' || p_hija;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=p_hija) THEN
    RAISE WARNING 'la tabla % no existe, se omite', p_hija;
    RETURN;
  END IF;

  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_nombre, p_hija);
  EXECUTE format($f$
    CREATE POLICY %I ON public.%I
    AS RESTRICTIVE FOR ALL
    USING       (EXISTS (SELECT 1 FROM public.%I p WHERE p.%I = public.%I.%I))
    WITH CHECK  (EXISTS (SELECT 1 FROM public.%I p WHERE p.%I = public.%I.%I))
  $f$, v_nombre, p_hija, p_padre, p_pk, p_hija, p_fk,
       p_padre, p_pk, p_hija, p_fk);
END;
$$;

-- Re-aplicar a todas las hijas del Grupo C EXCEPTO parent_athletes (ya
-- resuelta arriba con su propio club_id).
SELECT public._policy_hereda_de_padre('athlete_equipment', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_family', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_international_competitions', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_performance_predictions', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_socials', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_studies', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_testimonials', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_wheels', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('coach_athletes', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('competition_registrations', 'competition_id', 'competitions');
SELECT public._policy_hereda_de_padre('competition_resolutions', 'competition_id', 'competitions');
SELECT public._policy_hereda_de_padre('competition_results', 'competition_id', 'competitions');
SELECT public._policy_hereda_de_padre('relay_teams', 'competition_id', 'competitions');
SELECT public._policy_hereda_de_padre('relay_team_members', 'relay_team_id', 'relay_teams');
SELECT public._policy_hereda_de_padre('relay_results', 'relay_team_id', 'relay_teams');
SELECT public._policy_hereda_de_padre('league_stages', 'league_id', 'leagues');
SELECT public._policy_hereda_de_padre('league_standings', 'league_id', 'leagues');
SELECT public._policy_hereda_de_padre('training_attendance', 'training_session_id', 'training_sessions');
