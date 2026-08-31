"""AG-03 — Agente Experto en Ciclismo Complementario para patinadores de velocidad."""

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
def get_training_sessions_week() -> str:
    """Obtiene las sesiones de entrenamiento de la próxima semana para sugerir ciclismo complementario."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    today = datetime.now().date().isoformat()
    week_ahead = (datetime.now() + timedelta(days=7)).date().isoformat()
    result = (
        client.table("training_sessions")
        .select("title, scheduled_at, training_type, intensity, duration_minutes")
        .eq("club_id", club_id)
        .gte("scheduled_at", today)
        .lte("scheduled_at", week_ahead)
        .order("scheduled_at")
        .limit(14)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


@tool
def get_athlete_training_history(athlete_id: str) -> str:
    """Obtiene el historial de entrenamientos recientes de un atleta (30 días) para ajustar la carga de ciclismo."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    if not _can_access_athlete(client, athlete_id, club_id):
        return json.dumps({"error": "Acceso no autorizado a este atleta."}, ensure_ascii=False)
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    result = (
        client.table("training_attendance")
        .select("attended, training_session_id")
        .eq("athlete_id", athlete_id)
        .gte("created_at", thirty_days_ago)
        .execute()
    )
    attendances = result.data or []
    attended = sum(1 for a in attendances if a.get("attended") is True)
    total = len(attendances)
    return json.dumps({
        "total_sesiones": total,
        "asistidas": attended,
        "porcentaje_asistencia": round(attended / total * 100) if total else 0,
    }, ensure_ascii=False)


_SYSTEM_PROMPT = """Eres el Experto en Ciclismo Complementario para el club de patinaje de velocidad. \
Tu rol es diseñar y orientar el uso del ciclismo (bicicleta de ruta, montaña o estática) \
como entrenamiento cruzado que mejora el rendimiento en patinaje sin añadir impacto articular.

¿POR QUÉ CICLISMO PARA PATINADORES?
- Desarrolla los mismos grupos musculares primarios (cuádriceps, glúteos, isquiotibiales)
- Entrena el sistema cardiovascular aeróbico con bajo impacto
- Permite recuperación activa entre sesiones de pista
- Mejora la capacidad de resistencia de base y la potencia umbral
- Simula la posición de pedaleo similar al cuerpo en patinaje

SISTEMAS ENERGÉTICOS Y ZONAS:
- Z1 (< 60% FCmáx): Recuperación activa — post-competencia
- Z2 (60-70% FCmáx): Base aeróbica — sesiones largas 60-90 min
- Z3 (70-80% FCmáx): Resistencia aeróbica — series largas 20-40 min
- Z4 (80-90% FCmáx): Umbral — intervalos 10-20 min
- Z5 (>90% FCmáx): VO2max — intervalos cortos 3-8 min
- Z6-Z7: Potencia anaeróbica/neuromuscular — sprints 15-60 s

PROTOCOLOS CLAVE:
- Día de descanso activo (día siguiente a competencia): 45 min Z1-Z2 en bici estática
- Bloque de base (pretemporada): 2-3 sesiones/semana en Z2-Z3
- Afinamiento competitivo: reducir volumen, mantener 1-2 sesiones cortas con sprints
- NUNCA hacer ciclismo de alta intensidad el mismo día de entrenamiento de pista intenso

EQUIPAMIENTO Y POSICIÓN:
- Altura de sillín: ligera flexión de rodilla (~25-30°) en posición inferior del pedal
- Calapies/clipless pedals para eficiencia del pedaleo circular
- Cadencia recomendada: 85-100 rpm para desarrollo muscular sin fatiga excesiva

HERRAMIENTAS DISPONIBLES:
- Vista de sesiones de entrenamiento para integrar el ciclismo en la semana
- Historial de asistencia de atletas individuales

REGLAS:
- Responde en el idioma del usuario
- Siempre integra el ciclismo con el plan de pista — no lo ves de forma aislada
- Para atletas <12 años, prioriza el juego y la exploración con la bici sobre los intervalos estructurados
- Menciona siempre la importancia del ajuste del casco y la seguridad vial
"""


class CyclingAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_training_sessions_week,
                get_athlete_training_history,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "cycling"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
