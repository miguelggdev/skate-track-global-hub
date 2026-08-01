"""AG-05 — Agente Preparador Físico (Gym/Fuerza) para patinadores de velocidad."""

import json
from datetime import datetime, timedelta

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent
from database.supabase_client import get_supabase


@tool
def get_athlete_profile(athlete_id: str) -> str:
    """Obtiene el perfil físico de un atleta para diseñar un programa de fuerza personalizado."""
    client = get_supabase()
    result = (
        client.table("athletes")
        .select("first_name, last_name, category, birth_date, gender, weight_kg, height_cm")
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
        "peso_kg": a.get("weight_kg"),
        "talla_cm": a.get("height_cm"),
    }, ensure_ascii=False)


@tool
def get_training_week_overview() -> str:
    """Consulta las sesiones de entrenamiento de la semana actual para coordinar el trabajo de gimnasio."""
    client = get_supabase()
    today = datetime.now().date().isoformat()
    week_end = (datetime.now() + timedelta(days=7)).date().isoformat()
    result = (
        client.table("training_sessions")
        .select("title, scheduled_at, training_type, intensity_level, duration_minutes")
        .gte("scheduled_at", today)
        .lte("scheduled_at", week_end)
        .order("scheduled_at")
        .limit(14)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


@tool
def get_athletes_by_category(category: str) -> str:
    """Lista atletas activos de una categoría específica (ej: 'juvenil', 'mayores')."""
    client = get_supabase()
    result = (
        client.table("athletes")
        .select("id, first_name, last_name, category, weight_kg, height_cm")
        .eq("status", "active")
        .ilike("category", f"%{category}%")
        .limit(30)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False)


_SYSTEM_PROMPT = """Eres el Preparador Físico especializado en fuerza y acondicionamiento para patinadores \
de velocidad. Tu expertise cubre la periodización del entrenamiento de fuerza integrado con el trabajo en pista.

ESPECIALIDADES:
- Fuerza específica para patinaje: cuádriceps, glúteos, aductores, core, espalda baja
- Periodización ondulatoria y por bloques (hipertrofia → fuerza → potencia → mantenimiento)
- Pliometría y explosividad: saltos, sprints, plyos de cadera
- Trabajo de core para estabilidad en posición de patinaje
- Prevención de lesiones: rodillas, espalda, tobillo
- Integración del gimnasio con las sesiones en pista (no sobrecargar el mismo grupo muscular)
- Calentamiento y vuelta a la calma específicos para patinadores

EJERCICIOS CLAVE PARA PATINADORES:
- Sentadilla búlgara, sentadilla en posición de patinaje (asimétrica), sentadilla isométrica en pared
- Hip thrust, peso muerto rumano, extensiones de cadera
- Patinador lateral (side lunge), lateral band walks
- Plancha dinámica, rotaciones con cable, dead bug
- Saltos pliométricos: caja, sentadilla con salto, bounding lateral

CONTEXTO DEL DEPORTE:
Los patinadores de velocidad trabajan en flexión profunda de rodilla y cadera durante >85% del tiempo en pista. \
El programa de gym debe fortalecer esa posición, no solo músculos en posiciones neutras.

HERRAMIENTAS DISPONIBLES:
- Perfiles de atletas para personalizaciones
- Vista de la semana de entrenamiento para coordinar la carga

REGLAS:
- Responde en el idioma del usuario
- Siempre periodiza: indica la fase del ciclo (acumulación, transformación, competencia, recuperación)
- Para atletas menores de 14 años, evita cargas máximas y enfócate en técnica y coordinación
- Ante dolor articular, deriva inmediatamente al médico del club
- Sé concreto: da sets, reps, descanso, RPE cuando el usuario lo pida
"""


class GymAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_athlete_profile,
                get_training_week_overview,
                get_athletes_by_category,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "gym"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
