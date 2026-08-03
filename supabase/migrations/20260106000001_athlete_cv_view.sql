-- =============================================================
-- Vista athlete_cv_summary — Hoja de Vida Deportiva completa
-- Usa time_ms (no time_seconds) de time_records
-- =============================================================

CREATE OR REPLACE VIEW public.athlete_cv_summary AS
SELECT
  a.id,
  a.first_name,
  a.last_name,
  a.date_of_birth,
  a.category,
  a.level,
  a.gender,
  a.specialty,
  a.fedepatin_license,
  a.world_skate_id,
  a.is_elite_athlete,
  a.photo_url,
  a.bio,
  a.short_term_goals,
  a.long_term_goals,
  a.personal_values,
  a.dominant_distances,
  a.city,
  a.department,
  a.country,
  a.personal_phone,
  a.email,
  -- ¿Ha representado a Colombia en internacionales?
  COALESCE((
    SELECT bool_or(ic.is_national_team_rep)
    FROM public.athlete_international_competitions ic
    WHERE ic.athlete_id = a.id
  ), false) AS is_national_team_rep,
  -- Nombre del entrenador asignado
  (SELECT (p2.first_name || ' ' || p2.last_name)
   FROM public.profiles p2
   JOIN public.coaches c2 ON c2.user_id = p2.id
   WHERE c2.id = a.coach_id
   LIMIT 1
  ) AS coach_name,
  -- Mejores marcas personales por prueba (time_ms en milisegundos)
  (SELECT jsonb_agg(
      jsonb_build_object(
        'event',       re2.name,
        'time_ms',     tr2.time_ms,
        'time_fmt',    tr2.time_formatted,
        'competition', co2.name,
        'date',        tr2.recorded_at
      ) ORDER BY re2.name
    )
   FROM public.time_records tr2
   JOIN public.race_events re2 ON re2.id = tr2.race_event_id
   LEFT JOIN public.competitions co2 ON co2.id = tr2.competition_id
   WHERE tr2.athlete_id = a.id AND tr2.is_personal_best = true
  ) AS personal_bests,
  -- Resumen de medallas
  (SELECT jsonb_build_object(
      'gold',   COUNT(*) FILTER (WHERE aw.medal_type = 'gold'),
      'silver', COUNT(*) FILTER (WHERE aw.medal_type = 'silver'),
      'bronze', COUNT(*) FILTER (WHERE aw.medal_type = 'bronze')
    )
   FROM public.awards aw
   WHERE aw.athlete_id = a.id
  ) AS medals_summary,
  -- Historial deportivo
  ah.years_experience,
  ah.club_entry_date,
  ah.is_in_league,
  ah.is_federated,
  ah.federation_number,
  ah.is_national_team,
  ah.national_team_years,
  ah.category_history,
  ah.previous_clubs,
  -- Redes sociales
  aso.instagram,
  aso.tiktok,
  aso.youtube,
  aso.facebook,
  aso.whatsapp
FROM public.athletes a
LEFT JOIN public.athlete_history ah  ON ah.athlete_id  = a.id
LEFT JOIN public.athlete_socials aso ON aso.athlete_id = a.id;
