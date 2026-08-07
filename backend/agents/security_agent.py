import json
from datetime import datetime, timedelta, timezone

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent
from database.supabase_client import get_supabase


@tool
def get_recent_security_alerts() -> str:
    """Obtiene las últimas 20 alertas de seguridad: accesos sospechosos, anomalías y eventos críticos."""
    client = get_supabase()
    result = (
        client.table("notification_log")
        .select("automation_id, channel, subject, body, status, created_at")
        .in_("automation_id", ["AUTO-30", "AUTO-32", "AUTO-34"])
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    alerts = result.data or []
    return json.dumps({"total": len(alerts), "alertas": alerts}, ensure_ascii=False, default=str)


@tool
def get_user_roles_summary() -> str:
    """Lista todos los usuarios con sus roles activos en el sistema."""
    client = get_supabase()
    result = client.table("user_roles").select("user_id, role, created_at").execute()
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
    client = get_supabase()
    result = (
        client.table("agent_activity_log")
        .select("automation_id, agent_id, status, records_found, actions_taken, summary, error_message, ran_at")
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
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    client = get_supabase()
    result = (
        client.table("agent_activity_log")
        .select("automation_id, status, error_message, ran_at")
        .eq("status", "error")
        .gte("ran_at", since)
        .order("ran_at", desc=True)
        .execute()
    )
    failed = result.data or []
    return json.dumps({"failures_24h": len(failed), "detalles": failed}, ensure_ascii=False, default=str)


class SecurityAgent(BaseAgent):
    def get_agent(self):
        return create_react_agent(self.llm, tools=[
            get_recent_security_alerts,
            get_user_roles_summary,
            get_automation_security_activity,
            get_failed_automations_24h,
        ])

    def get_system_prompt(self) -> str:
        return (
            "Eres el Agente de Seguridad de SpeedSkateTrack Hub. "
            "Ayudas a los administradores a auditar accesos, revisar permisos de usuarios, "
            "detectar anomalías y mantener la seguridad de la plataforma. "
            "Tienes acceso a los registros de actividad, alertas del sistema y roles de usuarios. "
            "Cuando detectes problemas de seguridad, explica el riesgo y propón acciones concretas. "
            "Responde siempre en español."
        )
