"""AG-04 — Agente Nutricionista Deportivo para patinadores de velocidad."""

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
def get_athlete_profile(athlete_id: str) -> str:
    """Obtiene el perfil básico de un atleta (nombre, categoría, edad) para personalizar consejos nutricionales."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    if not _can_access_athlete(client, athlete_id, club_id):
        return json.dumps({"error": "Acceso no autorizado a este atleta."}, ensure_ascii=False)
    result = (
        client.table("athletes")
        .select("first_name, last_name, category, date_of_birth, gender, weight_kg, height_cm")
        .eq("id", athlete_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return json.dumps({"error": "Atleta no encontrado"}, ensure_ascii=False)
    a = result.data[0]
    age = None
    if a.get("date_of_birth"):
        born = datetime.fromisoformat(a["date_of_birth"])
        age = (datetime.now() - born).days // 365
    return json.dumps({
        "nombre": f"{a.get('first_name','')} {a.get('last_name','')}".strip(),
        "categoria": a.get("category"),
        "edad": age,
        "genero": a.get("gender"),
        "peso_kg": a.get("weight_kg"),
        "talla_cm": a.get("height_cm"),
    }, ensure_ascii=False)


@tool
def get_upcoming_training_load() -> str:
    """Obtiene las sesiones de entrenamiento de los próximos 7 días para orientar la planificación nutricional."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    today = datetime.now().date().isoformat()
    week_ahead = (datetime.now() + timedelta(days=7)).date().isoformat()
    result = (
        client.table("training_sessions")
        .select("title, scheduled_at, duration_minutes, training_type, intensity")
        .eq("club_id", club_id)
        .gte("scheduled_at", today)
        .lte("scheduled_at", week_ahead)
        .order("scheduled_at")
        .limit(10)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


@tool
def get_active_athletes_list() -> str:
    """Lista los atletas activos del club con sus categorías."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    result = (
        client.table("athletes")
        .select("id, first_name, last_name, category")
        .eq("club_id", club_id)
        .eq("status", "active")
        .order("last_name")
        .limit(50)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False)


_SYSTEM_PROMPT = """Eres el Nutricionista Deportivo especializado en patinaje de velocidad del club. \
Tu misión es brindar orientación nutricional científica y práctica para optimizar el rendimiento, \
la recuperación y la salud de los atletas.

ESPECIALIDADES:
- Nutrición periodizada según el ciclo de entrenamiento y competencia
- Hidratación para deportes de resistencia y potencia
- Estrategias pre/durante/post-competencia
- Suplementación deportiva segura y legal (antidoping)
- Nutrición para diferentes categorías: infantil, juvenil, mayores
- Composición corporal y peso saludable para patinadores

CONTEXTO DEL DEPORTE:
El patinaje de velocidad exige altas demandas de energía glucolítica y anaeróbica. \
Los atletas necesitan una base carbohidrática sólida, proteína adecuada para recuperación muscular, \
y estrategias de hidratación específicas dado el esfuerzo en pista (ambiente cerrado o al aire libre).

HERRAMIENTAS DISPONIBLES:
- Puedes consultar perfiles de atletas si el usuario proporciona el ID
- Puedes ver la carga de entrenamiento próxima para ajustar recomendaciones

REGLAS IMPORTANTES:
- Responde siempre en el idioma en que te hablan
- Cualquier plan nutricional intensivo debe ser supervisado por un nutricionista clínico certificado
- No prescribas suplementos sin consultar con el médico del club
- Para atletas menores, siempre involucra a los padres/tutores
- Si mencionas valores exactos (calorías, macros), indícalos como orientativos
- Nunca hagas diagnósticos médicos; para síntomas, deriva al médico

Eres un experto accesible, práctico y que da respuestas concretas con ejemplos de alimentos reales \
disponibles en Colombia/Latinoamérica.
"""


class NutritionAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_athlete_profile,
                get_upcoming_training_load,
                get_active_athletes_list,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "nutrition"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
