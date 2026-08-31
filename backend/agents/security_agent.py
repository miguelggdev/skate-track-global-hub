import json
from datetime import datetime, timedelta, timezone

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent, current_club_id
from database.supabase_client import get_supabase


@tool
def get_recent_security_alerts() -> str:
    """Obtiene las últimas 20 alertas de seguridad: accesos sospechosos, anomalías y eventos críticos."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    result = (
        client.table("notification_log")
        .select("automation_id, channel, subject, body, status, sent_at")
        .eq("club_id", club_id)
        .in_("automation_id", ["AUTO-30", "AUTO-32", "AUTO-34"])
        .order("sent_at", desc=True)
        .limit(20)
        .execute()
    )
    alerts = result.data or []
    return json.dumps({"total": len(alerts), "alertas": alerts}, ensure_ascii=False, default=str)


@tool
def get_user_roles_summary() -> str:
    """Lista todos los usuarios con sus roles activos en el sistema."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    result = client.table("user_roles").select("user_id, role, created_at").eq("club_id", club_id).execute()
    roles = result.data or []
    role_counts: dict[str, int] = {}
    for r in roles:
        role_counts[r.get("role", "desconocido")] = role_counts.get(r.get("role", "desconocido"), 0) + 1
    return json.dumps(
        {"total_usuarios": len(roles), "por_rol": role_counts, "usuarios": roles[:50]},
        ensure_ascii=False,
        default=str,
    )


@tool
def get_automation_security_activity(limit: int = 30) -> str:
    """Historial de actividad de las automatizaciones de seguridad (AUTO-30 a AUTO-35)."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    result = (
        client.table("agent_activity_log")
        .select("automation_id, agent_id, status, records_found, actions_taken, summary, error_message, ran_at")
        .eq("club_id", club_id)
        .ilike("automation_id", "AUTO-3%")
        .order("ran_at", desc=True)
        .limit(min(limit, 100))
        .execute()
    )
    logs = result.data or []
    return json.dumps({"total": len(logs), "registros": logs}, ensure_ascii=False, default=str)


@tool
def get_failed_automations_24h() -> str:
    """Automatizaciones que han fallado en las últimas 24 horas."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    client = get_supabase()
    result = (
        client.table("agent_activity_log")
        .select("automation_id, status, error_message, ran_at")
        .eq("club_id", club_id)
        .eq("status", "error")
        .gte("ran_at", since)
        .order("ran_at", desc=True)
        .execute()
    )
    failed = result.data or []
    return json.dumps({"failures_24h": len(failed), "detalles": failed}, ensure_ascii=False, default=str)


_SYSTEM_PROMPT = (
    "Eres el Agente de Seguridad de SpeedSkateTrack Hub. "
    "Ayudas a los administradores a auditar accesos, revisar permisos de usuarios, "
    "detectar anomalías y mantener la seguridad de la plataforma. "
    "Tienes acceso a los registros de actividad, alertas del sistema y roles de usuarios. "
    "Cuando detectes problemas de seguridad, explica el riesgo y propón acciones concretas. "
    "Responde siempre en español."
)


class SecurityAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_recent_security_alerts,
                get_user_roles_summary,
                get_automation_security_activity,
                get_failed_automations_24h,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "security"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
