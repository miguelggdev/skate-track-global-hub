import json
from datetime import datetime, timedelta

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent, current_club_id
from database.supabase_client import get_supabase


@tool
def get_training_sessions_overview() -> str:
    """Próximas 10 sesiones de entrenamiento y resumen de la semana en curso."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    today = datetime.now().date()
    week_start = (today - timedelta(days=today.weekday())).isoformat()
    upcoming = (
        client.table("training_sessions")
        .select("id, scheduled_at, training_type, location, max_athletes")
        .eq("club_id", club_id)
        .gte("scheduled_at", today.isoformat())
        .order("scheduled_at")
        .limit(10)
        .execute()
    )
    past_week = (
        client.table("training_sessions")
        .select("id, scheduled_at")
        .eq("club_id", club_id)
        .gte("scheduled_at", week_start)
        .lt("scheduled_at", today.isoformat())
        .execute()
    )
    return json.dumps(
        {
            "proximas_sesiones": upcoming.data or [],
            "sesiones_completadas_semana": len(past_week.data or []),
        },
        ensure_ascii=False,
        default=str,
    )


@tool
def get_equipment_status() -> str:
    """Inventario de equipamiento: disponible, en reparación y artículos con stock bajo."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    result = (
        client.table("equipment")
        .select("name, equipment_type, status, condition_notes, last_maintenance_at")
        .eq("club_id", club_id)
        .execute()
    )
    items = result.data or []
    in_repair = [i for i in items if i.get("status") == "maintenance"]
    return json.dumps(
        {
            "total_items": len(items),
            "en_reparacion": len(in_repair),
            "items_en_reparacion": in_repair,
        },
        ensure_ascii=False,
        default=str,
    )


@tool
def get_capacity_analysis() -> str:
    """Análisis de capacidad: atletas activos vs cupos en próximas sesiones."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    active = client.table("athletes").select("id", count="exact").eq("club_id", club_id).eq("status", "active").execute()
    upcoming = (
        client.table("training_sessions")
        .select("id, scheduled_at, max_athletes, training_type")
        .eq("club_id", club_id)
        .gte("scheduled_at", datetime.now().date().isoformat())
        .limit(5)
        .execute()
    )
    return json.dumps(
        {"atletas_activos": active.count or 0, "proximas_sesiones": upcoming.data or []},
        ensure_ascii=False,
        default=str,
    )


@tool
def get_today_operations_summary() -> str:
    """Resumen operativo del día: sesiones programadas y asistencia registrada hoy."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    today = datetime.now().date().isoformat()
    client = get_supabase()
    sessions = (
        client.table("training_sessions")
        .select("id, training_type, location")
        .eq("club_id", club_id)
        .gte("scheduled_at", f"{today}T00:00:00")
        .lte("scheduled_at", f"{today}T23:59:59")
        .execute()
    )
    session_ids = [s["id"] for s in (sessions.data or [])]
    if session_ids:
        attendance = (
            client.table("training_attendance")
            .select("id, attended")
            .in_("training_session_id", session_ids)
            .execute()
        )
    else:
        attendance = type("R", (), {"data": []})()
    present = [a for a in (attendance.data or []) if a.get("attended")]
    return json.dumps(
        {
            "fecha": today,
            "sesiones_hoy": sessions.data or [],
            "asistentes_presentes": len(present),
            "total_registros": len(attendance.data or []),
        },
        ensure_ascii=False,
        default=str,
    )


_SYSTEM_PROMPT = (
    "Eres el Agente de Operaciones de SpeedSkateTrack Hub. "
    "Tu especialidad es la eficiencia operativa del club: sesiones de entrenamiento, "
    "estado del equipamiento, análisis de capacidad y optimización de recursos. "
    "Ayudas a los coordinadores a tomar decisiones operativas informadas con datos reales. "
    "Responde siempre en español con datos concretos y recomendaciones accionables."
)


class OperationsAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_training_sessions_overview,
                get_equipment_status,
                get_capacity_analysis,
                get_today_operations_summary,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "operations"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
