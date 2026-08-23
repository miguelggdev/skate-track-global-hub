# -*- coding: utf-8 -*-
"""Genera el documento Word: Celery, Flower y la arquitectura de automatizaciones
de SpeedSkateTrack Hub. Requiere: pip install python-docx
"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ACCENT = RGBColor(0x0F, 0x6B, 0x5C)
INK = RGBColor(0x1A, 0x1D, 0x22)
MUTED = RGBColor(0x55, 0x5B, 0x66)
WARN_BORDER = "A6771A"
WARN_FILL = "F4E9D8"
INFO_BORDER = "0F6B5C"
INFO_FILL = "E6F4F0"

doc = Document()
sec = doc.sections[0]
sec.left_margin = Cm(2.1)
sec.right_margin = Cm(2.1)
sec.top_margin = Cm(2)
sec.bottom_margin = Cm(2)

style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(10.5)
style.font.color.rgb = INK
style.paragraph_format.space_after = Pt(6)


def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)


def cell_borders(cell, hexcolor, sz="8"):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), sz)
        el.set(qn("w:color"), hexcolor)
        borders.append(el)
    tcPr.append(borders)


def title(text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(22)
    r.font.bold = True
    r.font.color.rgb = ACCENT
    p.paragraph_format.space_after = Pt(2)


def subtitle(text):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.size = Pt(12)
    r.italic = True
    r.font.color.rgb = MUTED
    p.paragraph_format.space_after = Pt(18)


def h1(text, num=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(8)
    if num:
        rn = p.add_run(f"{num}  ")
        rn.font.size = Pt(14)
        rn.font.bold = True
        rn.font.color.rgb = MUTED
    r = p.add_run(text)
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = ACCENT
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "6")
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), "0F6B5C")
    pBdr.append(bottom)
    pPr.append(pBdr)


def h2(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    r.font.size = Pt(12.5)
    r.font.bold = True
    r.font.color.rgb = INK


def body(text, bold_lead=None):
    p = doc.add_paragraph()
    if bold_lead:
        rb = p.add_run(bold_lead + " ")
        rb.bold = True
    p.add_run(text)


def bullet(text, bold_lead=None):
    p = doc.add_paragraph(style="List Bullet")
    if bold_lead:
        rb = p.add_run(bold_lead + " ")
        rb.bold = True
    p.add_run(text)


def numbered(text):
    p = doc.add_paragraph(style="List Number")
    p.add_run(text)


def code(text, size=9):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.5)
    p.paragraph_format.space_after = Pt(8)
    run = p.add_run(text)
    run.font.name = "Consolas"
    run.font.size = Pt(size)
    run.font.color.rgb = MUTED
    shade_p = p._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), "F2F1EE")
    shade_p.append(shd)


def callout(label, text, fill=INFO_FILL, border=INFO_BORDER):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.rows[0].cells[0]
    shade(cell, fill)
    cell_borders(cell, border)
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    rl = p.add_run(label + "  ")
    rl.bold = True
    rl.font.color.rgb = RGBColor(int(border[0:2], 16), int(border[2:4], 16), int(border[4:6], 16))
    p.add_run(text)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def table(headers, rows, widths, mono_cols=()):
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = "Light Grid Accent 1"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for j, htext in enumerate(headers):
        cell = t.rows[0].cells[j]
        cell.width = widths[j]
        run = cell.paragraphs[0].add_run(htext)
        run.font.bold = True
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        shade(cell, "0F6B5C")
    for i, row_data in enumerate(rows, start=1):
        for j, val in enumerate(row_data):
            cell = t.rows[i].cells[j]
            cell.width = widths[j]
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(1)
            run = p.add_run(str(val))
            run.font.size = Pt(9)
            if j in mono_cols:
                run.font.name = "Consolas"
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return t


# ══════════════════════════════════════════════════════════════════════════
# PORTADA
# ══════════════════════════════════════════════════════════════════════════
title("Celery, Flower y las Automatizaciones")
subtitle("SpeedSkateTrack Hub — Arquitectura de tareas programadas y en segundo plano")

meta = doc.add_paragraph()
meta.add_run("Componente: ").bold = True
meta.add_run("Backend Python (FastAPI + Celery)\n")
meta.add_run("Cola / broker: ").bold = True
meta.add_run("Redis\n")
meta.add_run("Automatizaciones: ").bold = True
meta.add_run("37 tareas (AUTO-01 a AUTO-37)\n")
meta.add_run("Fecha: ").bold = True
meta.add_run("agosto 2026")

doc.add_paragraph()

# ══════════════════════════════════════════════════════════════════════════
h1("¿Qué es Celery?", "1.")
body(
    "Celery es una librería de Python para ejecutar tareas en segundo plano (background "
    "jobs), fuera del ciclo normal de petición-respuesta HTTP. Sirve para dos cosas "
    "principales:"
)
bullet(
    "Tareas que tardan demasiado para que el usuario espere una respuesta web (enviar un "
    "email, generar un reporte, procesar un archivo).",
    bold_lead="Trabajo diferido —",
)
bullet(
    "Tareas que deben ejecutarse en un horario fijo, sin que nadie las dispare manualmente "
    "(recordatorios diarios, cierres de caja, reportes semanales).",
    bold_lead="Tareas programadas (cron) —",
)
body(
    "Celery no funciona solo: necesita un \u2018broker\u2019 (una cola de mensajes) para "
    "comunicar qué tarea ejecutar y cuándo. En este proyecto ese broker es Redis "
    "(ver el documento sobre Redis para más detalle de esa pieza)."
)

# ══════════════════════════════════════════════════════════════════════════
h1("¿Qué es Flower?", "2.")
body(
    "Flower es un panel web de monitoreo para Celery. Permite ver, en tiempo real y sin "
    "tocar la terminal del servidor:"
)
bullet("Qué tareas se están ejecutando en este momento, y cuáles ya terminaron.")
bullet("Si una tarea falló, y el mensaje de error / traceback completo.")
bullet("Cuántos workers (procesos que ejecutan tareas) están activos y su carga.")
bullet("El historial de ejecuciones de cada una de las 37 automatizaciones.")
body(
    "Es, en resumen, el \u2018tablero de control\u2019 para saber si las automatizaciones del "
    "club están funcionando o si algo se rompió."
)

# ══════════════════════════════════════════════════════════════════════════
h1("Arquitectura general", "3.")
body(
    "El sistema de tareas en segundo plano está compuesto por 4 piezas, cada una en su "
    "propio contenedor Docker, que trabajan juntas:"
)

table(
    ["Pieza", "Rol", "Contenedor"],
    [
        ("Redis", "Cola de mensajes (broker) + almacén de resultados", "redis"),
        ("Celery Beat", "El \u2018reloj\u2019: dispara cada tarea programada a su hora exacta", "celery_beat"),
        ("Celery Worker", "El \u2018obrero\u2019: toma tareas de la cola y las ejecuta de verdad", "celery_worker"),
        ("Flower", "Panel web de monitoreo de todo lo anterior", "flower"),
    ],
    [Cm(3.2), Cm(9.2), Cm(3.2)],
)

body(
    "Flujo de una tarea programada (ej. \u2018recordatorio de entrenamiento\u2019 todos los "
    "días a las 19:00):"
)
numbered("Celery Beat revisa el reloj y, al llegar la hora programada, encola la tarea en Redis.")
numbered("Celery Worker está \u2018escuchando\u2019 esa cola en Redis; toma la tarea apenas aparece.")
numbered(
    "El Worker ejecuta el código real de la tarea (por ejemplo, consulta la base de datos "
    "de Supabase y envía un correo vía Resend)."
)
numbered("El resultado (éxito o error) se guarda de vuelta en Redis.")
numbered("Flower lee ese historial desde Redis y lo muestra en el panel web.")

callout(
    "Importante:",
    "Celery Beat NO ejecuta las tareas — solo las agenda / dispara. El trabajo real siempre "
    "lo hace Celery Worker. Si el worker se cae, las tareas se siguen agendando pero nunca "
    "se ejecutan (y se acumulan en la cola).",
)

# ══════════════════════════════════════════════════════════════════════════
h1("Cómo se usa en SpeedSkateTrack Hub", "4.")
h2("Configuración base (tasks/celery_app.py)")
body(
    "El proyecto define un único \u2018app\u2019 de Celery (llamado skate_tasks) con estas "
    "reglas clave:"
)
bullet("Redis como broker y como backend de resultados (misma instancia, dos usos).", bold_lead="broker / backend —")
bullet("America/Bogota — todos los horarios de las automatizaciones son en esa zona horaria.", bold_lead="timezone —")
bullet(
    "Si una tarea falla, Celery la reintenta hasta 3 veces, con backoff exponencial "
    "(espera cada vez más entre intentos, hasta un máximo de 300 segundos).",
    bold_lead="reintentos —",
)
bullet(
    "El worker confirma que completó la tarea después de ejecutarla (no antes) — si el "
    "proceso muere a mitad de una tarea, esa tarea no se pierde, se reintenta.",
    bold_lead="task_acks_late —",
)
bullet(
    "Cada worker toma una tarea a la vez de la cola en vez de acaparar varias — evita que "
    "un worker se sobrecargue mientras otro está libre.",
    bold_lead="worker_prefetch_multiplier=1 —",
)

h2("Las 37 automatizaciones (AUTO-01 a AUTO-37)")
body(
    "Están organizadas en 8 módulos por área del negocio, dentro de backend/tasks/. Se "
    "dividen en dos tipos:"
)
bullet(
    "Tienen un horario fijo en el \u2018beat_schedule\u2019 de Celery Beat (tabla de la sección "
    "siguiente). Se disparan solas, nadie las llama.",
    bold_lead="Programadas (cron) —",
)
bullet(
    "No tienen horario — se disparan cuando ocurre un evento puntual (un pago, una "
    "inscripción, una cancelación). El código de la API las llama directamente con "
    ".delay(...) en el momento en que pasa el evento.",
    bold_lead="Por evento (event-driven) —",
)

doc.add_page_break()

h2("Tabla completa de automatizaciones por módulo")

auto_rows = [
    ("Calendar", "AUTO-01", "Recordatorio de entrenamiento (día siguiente)", "Diario 19:00"),
    ("Calendar", "AUTO-02", "Recordatorio 2h antes del entrenamiento", "Cada 30 min"),
    ("Calendar", "AUTO-03", "Detección de huecos en el calendario", "Lunes 08:00"),
    ("Calendar", "AUTO-04", "Manejo de ausencias", "Evento (cancelación)"),
    ("Calendar", "AUTO-05", "Lista de espera / cupo liberado", "Evento (cancelación)"),
    ("Calendar", "AUTO-06", "Análisis semanal de carga de entrenamiento", "Viernes 20:00"),
    ("Finance", "AUTO-07", "Recibo automático de pago", "Evento (nuevo ingreso)"),
    ("Finance", "AUTO-08", "Alertas de cartera morosa", "Días 1 y 15, 09:00"),
    ("Finance", "AUTO-09", "Cierre de caja diario", "Diario 22:00"),
    ("Finance", "AUTO-10", "Proyección financiera mensual", "Fin de mes 18:00"),
    ("Finance", "AUTO-11", "Recordatorio renovación de membresía", "Diario 08:00"),
    ("Athletes", "AUTO-12", "Seguimiento post-competencia", "Evento (resultado)"),
    ("Athletes", "AUTO-13", "Recordatorio evaluación semestral", "Lunes 10:00"),
    ("Athletes", "AUTO-14", "Protocolo ante lesión", "Evento (sesión médica)"),
    ("Athletes", "AUTO-15", "Monitoreo de progreso semanal", "Lunes 07:00"),
    ("Admin", "AUTO-16", "Briefing matutino", "Lun–Vie 07:30"),
    ("Admin", "AUTO-17", "Resumen de fin de día", "Lun–Sáb 21:00"),
    ("Admin", "AUTO-18", "Chequeo de documentos vencidos", "Diario 09:00"),
    ("Admin", "AUTO-19", "Control de inventario de equipos", "Lunes 06:00"),
    ("Admin", "AUTO-20", "Documentos para nuevo atleta", "Evento (alta atleta)"),
    ("Marketing", "AUTO-21", "Felicitaciones de cumpleaños", "Diario 07:00"),
    ("Marketing", "AUTO-22", "Reactivación de atletas inactivos", "Días 1 y 15, 10:00"),
    ("Marketing", "AUTO-23", "Encuesta de satisfacción", "Trimestral (ene/abr/jul/oct)"),
    ("Marketing", "AUTO-24", "Solicitud de testimonio", "Evento (24h post top-3)"),
    ("Marketing", "AUTO-25", "Campaña de pre-inscripción temporada", "1 octubre 09:00"),
    ("Reporting", "AUTO-26", "Reporte semanal directivo", "Domingo 20:00"),
    ("Reporting", "AUTO-27", "Reporte mensual de rendimiento", "1er día de mes 08:00"),
    ("Reporting", "AUTO-28", "Documentación federativa", "1 agosto 09:00"),
    ("Reporting", "AUTO-29", "Análisis predictivo", "Domingo 23:00"),
    ("Security", "AUTO-30", "Detección de accesos sospechosos", "Evento (login)"),
    ("Security", "AUTO-31", "Verificación de backups", "Diario 03:00"),
    ("Security", "AUTO-32", "Auditoría de datos sensibles", "Domingo 04:00"),
    ("Security", "AUTO-33", "Rotación de sesiones inactivas", "Diario 02:00"),
    ("Security", "AUTO-34", "Notificaciones en tiempo real", "Evento"),
    ("Security", "AUTO-35", "Resumen de actividad de agentes IA", "Diario 23:30"),
    ("WhatsApp", "AUTO-36", "Frase motivadora diaria (WhatsApp)", "Diario 08:30"),
    ("Billing", "AUTO-36b", "Generación de cuotas mensuales", "1er día de mes 07:00"),
    ("Billing", "AUTO-37", "Recordatorio de pago de factura", "Diario 09:00"),
]
table(
    ["Módulo", "ID", "Automatización", "Frecuencia"],
    auto_rows,
    [Cm(2.3), Cm(1.7), Cm(7.6), Cm(4.0)],
)

callout(
    "Nota sobre costos:",
    "ninguna de estas 37 tareas llama a un modelo de IA (Claude) — son consultas a la base "
    "de datos y envíos de email/WhatsApp. El uso de IA queda limitado al chat de agentes y "
    "al RAG, que son iniciados por personas, no por Celery Beat.",
)

# ══════════════════════════════════════════════════════════════════════════
h1("Acceso a Flower", "5.")
body("El panel de Flower queda disponible, tras el deploy, en:")
code("https://split.arkanatech.tech/flower")
body(
    "Protegido con usuario y clave (Basic Auth), definidos en el archivo .env.production "
    "del servidor:"
)
code("FLOWER_USER=admin\nFLOWER_PASSWORD=<clave generada con openssl rand -base64 20>")
body(
    "Además, Traefik expone ese dominio solo por HTTPS (certificado automático), así que "
    "la clave nunca viaja sin cifrar."
)

h2("Qué se puede ver / hacer en Flower")
bullet("Pestaña \u2018Tasks\u2018: cada ejecución de las 37 automatizaciones, con su estado (éxito, fallo, en curso).")
bullet("Pestaña \u2018Workers\u2018: cuántos procesos worker están activos, memoria/CPU, última vez que respondieron.")
bullet("Pestaña \u2018Broker\u2018: cuántas tareas hay esperando en la cola de Redis en este momento.")
bullet("Click en cualquier tarea fallida muestra el traceback completo del error en Python.")

# ══════════════════════════════════════════════════════════════════════════
h1("Comandos útiles (en el VPS)", "6.")

h2("Ver logs en vivo de cada pieza")
code(
    "docker compose logs -f celery_worker\n"
    "docker compose logs -f celery_beat\n"
    "docker compose logs -f flower"
)

h2("Reiniciar solo el worker (ej. tras un cambio de código)")
code("docker compose restart celery_worker celery_beat")

h2("Ejecutar una tarea manualmente para probarla (desde dentro del contenedor)")
code(
    "docker compose exec backend python -c \\\n"
    "  \"from tasks.calendar_tasks import training_reminder_next_day; "
    "training_reminder_next_day.delay()\""
)

h2("Ver cuántas tareas hay pendientes en la cola de Redis")
code("docker compose exec redis redis-cli -a $REDIS_PASSWORD llen celery")

# ══════════════════════════════════════════════════════════════════════════
h1("Resolución de problemas comunes", "7.")
bullet(
    "Revisa docker compose logs celery_worker — casi siempre el error real (traceback de "
    "Python) aparece ahí, y también en Flower dentro del detalle de la tarea.",
    bold_lead="Una automatización no se ejecutó —",
)
bullet(
    "Verifica que el contenedor celery_beat esté corriendo (docker compose ps) — si Beat "
    "está caído, nada se agenda, aunque el worker esté sano.",
    bold_lead="Ninguna tarea programada corre —",
)
bullet(
    "Puede ser una tarea event-driven esperando que algo la dispare (ej. AUTO-07 espera un "
    "pago nuevo) — revisa en la tabla de la sección 4 si es \u2018cron\u2019 o \u2018evento\u2019 "
    "antes de asumir que está rota.",
    bold_lead="Una tarea \u2018nunca se ejecuta\u2019 —",
)
bullet(
    "Suele significar que el worker está caído o saturado. docker compose restart "
    "celery_worker suele resolverlo; si persiste, revisar uso de CPU/RAM del VPS.",
    bold_lead="Las tareas se acumulan en la cola sin procesarse —",
)

callout(
    "Recordatorio de seguridad:",
    "Flower muestra datos operativos del club (nombres de tareas, a veces fragmentos de "
    "payloads). Mantén FLOWER_PASSWORD segura y no compartas la URL públicamente.",
    fill=WARN_FILL,
    border=WARN_BORDER,
)

out = r"C:\Users\Miguel Angel GG\Documents\PROYECTOS_CLAUDE\SKATE\skate-track-global-hub-main\skate-track-global-hub-main\docs\CELERY_FLOWER_ARQUITECTURA.docx"
doc.save(out)
print("OK:", out)
