-- =============================================================
-- Multi-tenant — Fase 3: tablas hija (Grupo C). Ver plan completo en
-- ~/.claude/plans/linear-roaming-torvalds.md y
-- docs/manual-multitenant-supabase-portable.md §4.6.
--
-- Estas tablas NO llevan club_id propio — heredan el acceso del padre vía
-- EXISTS. Como el padre ya tiene su policy restrictiva (Fase 2) + sus
-- policies de rol, el EXISTS las respeta automáticamente (las subqueries
-- de una policy SÍ quedan sujetas al RLS del padre cuando el rol actual no
-- tiene BYPASSRLS).
--
-- ⚠️ point_tables NO se toca en esta migración — a diferencia del resto
-- de "hijas", no tiene ninguna columna que la ligue a un club ni a una
-- liga (solo name/competition_type/season_year/points_config/created_by).
-- El plan la listaba como "hija de leagues" pero el schema real no tiene
-- esa FK. Puede ser un catálogo de esquemas de puntaje compartido entre
-- clubes (ej. "Tabla IOC 2024") a propósito — se deja como está (sin RLS
-- de aislamiento) hasta confirmar con el usuario si debe ser por club.
-- =============================================================

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

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_hija);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', p_hija);
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_nombre, p_hija);
  EXECUTE format($f$
    CREATE POLICY %I ON public.%I FOR ALL
    USING       (EXISTS (SELECT 1 FROM public.%I p WHERE p.%I = public.%I.%I))
    WITH CHECK  (EXISTS (SELECT 1 FROM public.%I p WHERE p.%I = public.%I.%I))
  $f$, v_nombre, p_hija, p_padre, p_pk, p_hija, p_fk,
       p_padre, p_pk, p_hija, p_fk);
END;
$$;

-- Hijas de athletes
SELECT public._policy_hereda_de_padre('athlete_equipment', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_family', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_international_competitions', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_performance_predictions', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_socials', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_studies', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_testimonials', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('athlete_wheels', 'athlete_id', 'athletes');

-- Tablas puente
SELECT public._policy_hereda_de_padre('coach_athletes', 'athlete_id', 'athletes');
SELECT public._policy_hereda_de_padre('parent_athletes', 'athlete_id', 'athletes');

-- Hijas de competitions
SELECT public._policy_hereda_de_padre('competition_registrations', 'competition_id', 'competitions');
SELECT public._policy_hereda_de_padre('competition_resolutions', 'competition_id', 'competitions');
SELECT public._policy_hereda_de_padre('competition_results', 'competition_id', 'competitions');

-- Cadena relay: relay_teams cuelga de competitions; team_members/results
-- cuelgan de relay_teams (el EXISTS encadena solo, porque relay_teams ya
-- queda protegida por su propia policy heredada).
SELECT public._policy_hereda_de_padre('relay_teams', 'competition_id', 'competitions');
SELECT public._policy_hereda_de_padre('relay_team_members', 'relay_team_id', 'relay_teams');
SELECT public._policy_hereda_de_padre('relay_results', 'relay_team_id', 'relay_teams');

-- Hijas de leagues
SELECT public._policy_hereda_de_padre('league_stages', 'league_id', 'leagues');
SELECT public._policy_hereda_de_padre('league_standings', 'league_id', 'leagues');

-- Hija de training_sessions
SELECT public._policy_hereda_de_padre('training_attendance', 'training_session_id', 'training_sessions');

-- Caso especial: profiles (1 fila por auth.users, sin FK a un padre —
-- hereda por PK compartida con user_claims/club vía get_user_club_id()).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON public.profiles;
CREATE POLICY tenant_isolation ON public.profiles
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.same_club(public.get_user_club_id(id)))
  WITH CHECK (public.same_club(public.get_user_club_id(id)));
