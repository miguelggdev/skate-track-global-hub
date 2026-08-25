"""AG-13 — Agente de Psicología Deportiva para patinadores de velocidad."""

import json
from datetime import datetime, timedelta

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent, current_user_id, current_user_role, current_club_id
from database.supabase_client import get_supabase

_STAFF_ROLES = {"admin", "coach", "leader"}


def _can_access_athlete(client, athlete_id: str, club_id: str) -> bool:
    """Retorna True si el atleta pertenece al club actual Y el usuario puede ver sus datos
    (staff del club, o el propio atleta)."""
    own = client.table("athletes").select("user_id, club_id").eq("id", athlete_id).limit(1).execute()
    if not own.data or own.data[0].get("club_id") != club_id:
        return False
    role = current_user_role.get()
    if role in _STAFF_ROLES:
        return True
    uid = current_user_id.get()
    return bool(uid) and own.data[0].get("user_id") == uid


@tool
def get_athlete_competition_history(athlete_id: str) -> str:
    """Obtiene el historial de competencias de un atleta para contextualizar el trabajo psicológico."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    if not _can_access_athlete(client, athlete_id, club_id):
        return json.dumps({"error": "Sin permiso para acceder a este atleta"}, ensure_ascii=False)
    result = (
        client.table("competition_registrations")
        .select("id, competition_id, created_at")
        .eq("athlete_id", athlete_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    registrations = result.data or []
    return json.dumps({
        "total_competencias_registradas": len(registrations),
        "registros": registrations,
    }, ensure_ascii=False, default=str)


@tool
def get_upcoming_competitions() -> str:
    """Lista las próximas competencias para orientar la preparación mental."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    today = datetime.now().date().isoformat()
    result = (
        client.table("competitions")
        .select("name, start_date, location, competition_level")
        .eq("club_id", club_id)
        .gte("start_date", today)
        .order("start_date")
        .limit(5)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


@tool
def get_athlete_profile(athlete_id: str) -> str:
    """Obtiene datos básicos del atleta para personalizar el apoyo psicológico."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    if not _can_access_athlete(client, athlete_id, club_id):
        return json.dumps({"error": "Sin permiso para acceder a este atleta"}, ensure_ascii=False)
    result = (
        client.table("athletes")
        .select("first_name, last_name, category, birth_date, gender")
        .eq("id", athlete_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return json.dumps({"error": "Atleta no encontrado"}, ensure_ascii=False)
    a = result.data[0]
    age = None
    if a.get("birth_date"):
        born = datetime.fromisoformat(a["birth_date"])
        age = (datetime.now() - born).days // 365
    return json.dumps({
        "nombre": f"{a.get('first_name','')} {a.get('last_name','')}".strip(),
        "categoria": a.get("category"),
        "edad": age,
        "genero": a.get("gender"),
    }, ensure_ascii=False)


_SYSTEM_PROMPT = """Eres el Psicólogo Deportivo del club de patinaje de velocidad. \
Apoyas a atletas, entrenadores y padres en el desarrollo mental, emocional y motivacional \
para alcanzar el máximo rendimiento y el bienestar integral.

⚠️ IMPORTANTE: Eres un asistente de psicología DEPORTIVA. No tratas trastornos clínicos. \
Si detectas señales de crisis emocional severa (ideación suicida, depresión grave, ansiedad \
clínica), deriva inmediatamente a un psicólogo clínico certificado o a los servicios de salud.

ÁREAS DE TRABAJO:

🎯 CONCENTRACIÓN Y ATENCIÓN
- Técnicas de focalización: punto de atención, señal de activación pre-carrera
- Control del diálogo interno (self-talk): identificar y reencuadrar pensamientos negativos
- Rutinas pre-competencia para alcanzar el estado óptimo de activación

💪 CONFIANZA Y AUTOEFICACIA
- Establecimiento de metas SMART (específicas, medibles, alcanzables, relevantes, temporales)
- Registro de logros y progreso para construir evidencia de competencia
- Manejo del perfeccionismo y el miedo al error en atletas jóvenes

😰 ANSIEDAD COMPETITIVA
- Diferencia entre ansiedad facilitadora (eustress) y paralizante (distress)
- Técnicas de respiración: diafragmática, coherencia cardíaca (5-5 rítmico)
- Técnica 5-4-3-2-1 de enraizamiento (grounding) para activación nerviosa alta
- Visualización mental: técnica PETTLEP (Físico, Entorno, Tarea, Timing, Aprendizaje, Emoción, Perspectiva)

🧘 RECUPERACIÓN MENTAL
- Diferencia entre recuperación física y psicológica
- Técnicas de desconexión entre sesiones (mindfulness, actividades no-deportivas)
- Gestión del sobreentrenamiento psicológico (burnout deportivo)

👨‍👩‍👧 TRABAJO CON PADRES Y ENTRENADORES
- Comunicación constructiva entrenador-atleta-padres
- Presión parental: cómo gestionar expectativas sin afectar al atleta
- Motivación intrínseca vs. extrínseca: cuándo los premios ayudan y cuándo dañan

🏆 PERIODIZACIÓN MENTAL
- Preparación mental en pretemporada, competencia y temporada baja
- Protocolos de la competencia: día anterior, mañana de competencia, calentamiento, entre series
- Debriefing post-competencia: cómo analizar sin juzgar

HERRAMIENTAS DISPONIBLES:
- Historial de competencias de atletas (para contextualizar el nivel de experiencia)
- Próximas competencias (para diseñar planes de preparación mental con fecha)
- Perfil básico del atleta

REGLAS:
- Responde en el idioma del usuario
- Sé empático y no directivo — haz preguntas antes de dar soluciones
- Para atletas menores, involucra a padres/tutores y entrenadores en el proceso
- Nunca minimices el malestar emocional ("eso es normal", "no es para tanto")
- Si el atleta menciona querer rendirse o dejar el deporte, explora con cuidado antes de dar respuesta
- Eres un apoyo, no un terapeuta clínico
"""


class PsychologyAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_athlete_competition_history,
                get_upcoming_competitions,
                get_athlete_profile,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "psychology"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
