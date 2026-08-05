-- ============================================================
-- AUTO-36: WhatsApp frases motivadoras diarias
-- Tablas: motivational_phrases, whatsapp_subscribers,
--         whatsapp_message_log
-- Storage bucket: whatsapp-motivational (imágenes deportivas)
-- ============================================================

-- ── 1. Frases motivadoras ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.motivational_phrases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase          TEXT        NOT NULL,
    author          TEXT,
    category        TEXT        NOT NULL DEFAULT 'motivacion'
                    CHECK (category IN ('motivacion','disciplina','equipo','tecnica','vida')),
    used_count      INTEGER     NOT NULL DEFAULT 0,
    last_used_at    TIMESTAMPTZ,
    active          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_motivational_phrases_category ON public.motivational_phrases(category);
CREATE INDEX IF NOT EXISTS idx_motivational_phrases_last_used ON public.motivational_phrases(last_used_at NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_motivational_phrases_active ON public.motivational_phrases(active) WHERE active = TRUE;

ALTER TABLE public.motivational_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_motivational_phrases" ON public.motivational_phrases
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "all_select_motivational_phrases" ON public.motivational_phrases
    FOR SELECT USING (active = TRUE);

-- ── 2. Suscriptores WhatsApp ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.whatsapp_subscribers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number    TEXT        NOT NULL UNIQUE,   -- formato internacional: +57XXXXXXXXXX
    user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    athlete_id      UUID        REFERENCES public.athletes(id) ON DELETE SET NULL,
    name            TEXT,
    active          BOOLEAN     NOT NULL DEFAULT TRUE,
    opted_in_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opted_out_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_subs_active ON public.whatsapp_subscribers(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_whatsapp_subs_phone  ON public.whatsapp_subscribers(phone_number);

ALTER TABLE public.whatsapp_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_whatsapp_subscribers" ON public.whatsapp_subscribers
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── 3. Log de mensajes enviados ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.whatsapp_message_log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase_id        UUID        REFERENCES public.motivational_phrases(id) ON DELETE SET NULL,
    image_url        TEXT,
    image_source     TEXT        CHECK (image_source IN ('storage','ai_generated','none')),
    recipients_count INTEGER     NOT NULL DEFAULT 0,
    errors_count     INTEGER     NOT NULL DEFAULT 0,
    status           TEXT        NOT NULL DEFAULT 'sent'
                     CHECK (status IN ('sent','partial','failed')),
    sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_whatsapp_log" ON public.whatsapp_message_log
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ── 4. Storage bucket para imágenes ─────────────────────────────────────────
-- Requiere ejecutar en Supabase Dashboard si el bucket no existe:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('whatsapp-motivational', 'whatsapp-motivational', true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'whatsapp-motivational',
    'whatsapp-motivational',
    TRUE,
    10485760,  -- 10 MB max por imagen
    ARRAY['image/jpeg','image/png','image/webp','image/jpg']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admin_upload_whatsapp_images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'whatsapp-motivational'
        AND has_role(auth.uid(), 'admin')
    );

CREATE POLICY "public_read_whatsapp_images" ON storage.objects
    FOR SELECT USING (bucket_id = 'whatsapp-motivational');

CREATE POLICY "admin_delete_whatsapp_images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'whatsapp-motivational'
        AND has_role(auth.uid(), 'admin')
    );

-- ── 5. Seed — 50 frases iniciales (5 categorías × 10) ────────────────────────
-- El script backend/scripts/seed_motivational_phrases.py genera las 500 completas.

INSERT INTO public.motivational_phrases (phrase, author, category) VALUES

-- MOTIVACIÓN (10)
('El campeón no es el que nunca cae, sino el que se levanta cada vez más fuerte.', NULL, 'motivacion'),
('Cada vuelta en la pista es un paso más cerca de tu sueño.', NULL, 'motivacion'),
('El éxito no llega por accidente. Llega con sacrificio, perseverancia y pasión.', NULL, 'motivacion'),
('Tu mayor competencia eres tú mismo de ayer.', NULL, 'motivacion'),
('Los límites solo existen en la mente. Tu cuerpo puede más de lo que crees.', NULL, 'motivacion'),
('No busques la motivación, conviértela en disciplina y nunca la perderás.', NULL, 'motivacion'),
('El dolor de hoy es la fuerza de mañana.', NULL, 'motivacion'),
('Los grandes campeones se hacen cuando nadie está mirando.', NULL, 'motivacion'),
('Cree en ti incluso cuando nadie más lo hace. Esa es la verdadera fortaleza.', NULL, 'motivacion'),
('Si puedes soñarlo, puedes entrenarlo. Si puedes entrenarlo, puedes lograrlo.', NULL, 'motivacion'),

-- DISCIPLINA (10)
('La disciplina es elegir entre lo que quieres ahora y lo que más quieres.', NULL, 'disciplina'),
('El talento te lleva al torneo, la disciplina te hace ganar.', NULL, 'disciplina'),
('Un día a la vez. Un esfuerzo a la vez. Una victoria a la vez.', NULL, 'disciplina'),
('La constancia construye imperios. La pereza los destruye.', NULL, 'disciplina'),
('Haz hoy lo que otros no harán para lograr mañana lo que otros no pueden.', NULL, 'disciplina'),
('El éxito es la suma de pequeños esfuerzos repetidos día tras día.', 'Robert Collier', 'disciplina'),
('La rutina no es aburrimiento. Es el camino silencioso a la excelencia.', NULL, 'disciplina'),
('Cuando más te duele entrenar, más lejos llegas en competencia.', NULL, 'disciplina'),
('No es necesario estar de humor para actuar. La acción crea el estado de ánimo.', NULL, 'disciplina'),
('Somos lo que hacemos repetidamente. La excelencia no es un acto, es un hábito.', 'Aristóteles', 'disciplina'),

-- EQUIPO (10)
('Solo llegas más rápido, juntos llegas más lejos.', NULL, 'equipo'),
('El equipo que compite junto, triunfa junto.', NULL, 'equipo'),
('Tu compañero de entrenamiento no es tu rival, es tu impulso.', NULL, 'equipo'),
('La victoria más dulce es la que se celebra en equipo.', NULL, 'equipo'),
('Un equipo fuerte se construye con atletas que se elevan mutuamente.', NULL, 'equipo'),
('Cuando tu compañero cae, levántalo. Cuando caes tú, él te levanta a ti.', NULL, 'equipo'),
('La grandeza individual se multiplica en el equipo.', NULL, 'equipo'),
('Confía en tu equipo tanto como confías en tus patines.', NULL, 'equipo'),
('El mejor momento de ganar es cuando gana alguien de tu equipo.', NULL, 'equipo'),
('Ningún atleta llega a la cima solo. Detrás siempre hay un equipo que creyó.', NULL, 'equipo'),

-- TÉCNICA (10)
('La técnica perfecta no se improvisa, se construye repetición a repetición.', NULL, 'tecnica'),
('Cada pequeña mejora técnica es una gran ventaja en competencia.', NULL, 'tecnica'),
('La velocidad sin técnica es energía desperdiciada.', NULL, 'tecnica'),
('El detalle que parece pequeño en entrenamiento decide la medalla en competencia.', NULL, 'tecnica'),
('Analiza tu carrera, encuentra el error, corrígelo. Eso es crecer.', NULL, 'tecnica'),
('Tus patines son una extensión de tu cuerpo. Conócelos como te conoces a ti mismo.', NULL, 'tecnica'),
('El atleta de élite domina los fundamentos mejor que nadie.', NULL, 'tecnica'),
('La curva perfecta no se domina en un día, pero sí se domina.', NULL, 'tecnica'),
('Corrige tu postura hoy para que tu cuerpo no te lo cobre mañana.', NULL, 'tecnica'),
('Practica lento para competir rápido. La velocidad correcta llega sola.', NULL, 'tecnica'),

-- VIDA Y VALORES (10)
('El deporte te enseña más sobre la vida que cualquier aula.', NULL, 'vida'),
('La disciplina en la pista se convierte en carácter fuera de ella.', NULL, 'vida'),
('Sé el atleta que tu yo de 10 años soñó que serías.', NULL, 'vida'),
('Gana con humildad, pierde con dignidad. Así se construye un campeón.', NULL, 'vida'),
('El carácter que muestras cuando pierdes define quién eres realmente.', NULL, 'vida'),
('No entrenes para ser el mejor del mundo. Entrena para ser tu mejor versión.', NULL, 'vida'),
('Lo que le das al deporte, el deporte te lo devuelve multiplicado.', NULL, 'vida'),
('El respeto al rival empieza con el respeto a ti mismo.', NULL, 'vida'),
('Cada esfuerzo que haces hoy es una carta de amor a tu futuro.', NULL, 'vida'),
('El deporte no te forma el cuerpo, te forma el alma.', NULL, 'vida');
