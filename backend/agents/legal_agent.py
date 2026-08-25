import json
from datetime import date, timedelta

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent, current_club_id
from database.supabase_client import get_supabase


@tool
def get_parental_consent_status() -> str:
    """Verifica el estado de consentimientos parentales para atletas menores de edad."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    today = date.today()
    client = get_supabase()
    athletes = (
        client.table("athletes")
        .select("id, first_name, last_name, date_of_birth, status")
        .eq("club_id", club_id)
        .eq("status", "active")
        .execute()
    )
    minors = [
        a for a in (athletes.data or [])
        if a.get("date_of_birth")
        and (today - date.fromisoformat(a["date_of_birth"])).days < 18 * 365
    ]
    docs = (
        client.table("documents")
        .select("athlete_id, document_type, expiry_date, status")
        .eq("club_id", club_id)
        .eq("document_type", "parental_consent")
        .execute()
    )
    consented_ids = {d["athlete_id"] for d in (docs.data or []) if d.get("status") == "active"}
    missing = [m for m in minors if m["id"] not in consented_ids]
    return json.dumps(
        {
            "total_menores_activos": len(minors),
            "con_consentimiento": len(consented_ids & {m["id"] for m in minors}),
            "sin_consentimiento": len(missing),
            "pendientes": [{"nombre": f"{m.get('first_name', '')} {m.get('last_name', '')}".strip(), "id": m.get("id")} for m in missing],
        },
        ensure_ascii=False,
        default=str,
    )


@tool
def get_expiring_documents(days_ahead: int = 60) -> str:
    """Lista los documentos legales y reglamentarios que vencen pronto."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    today = date.today()
    until = (today + timedelta(days=days_ahead)).isoformat()
    client = get_supabase()
    result = (
        client.table("documents")
        .select("title, document_type, expiry_date, athlete_id, status")
        .eq("club_id", club_id)
        .lte("expiry_date", until)
        .gte("expiry_date", today.isoformat())
        .eq("status", "active")
        .order("expiry_date")
        .execute()
    )
    docs = result.data or []
    return json.dumps(
        {"dias_horizonte": days_ahead, "total": len(docs), "documentos": docs},
        ensure_ascii=False,
        default=str,
    )


@tool
def get_insurance_coverage_summary() -> str:
    """Resumen de coberturas de seguro de los atletas activos."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    active = client.table("athletes").select("id", count="exact").eq("club_id", club_id).eq("status", "active").execute()
    insurance = (
        client.table("documents")
        .select("athlete_id, document_type, expiry_date, status")
        .eq("club_id", club_id)
        .eq("document_type", "insurance")
        .eq("status", "active")
        .execute()
    )
    total_active = active.count or 0
    insured = insurance.data or []
    return json.dumps(
        {
            "atletas_activos": total_active,
            "con_seguro_vigente": len(insured),
            "sin_seguro": max(total_active - len(insured), 0),
            "coberturas": insured,
        },
        ensure_ascii=False,
        default=str,
    )


@tool
def get_regulatory_compliance_checklist() -> str:
    """Lista de verificación de cumplimiento regulatorio FCP para el club."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    total = client.table("athletes").select("id", count="exact").eq("club_id", club_id).eq("status", "active").execute()
    docs = client.table("documents").select("id", count="exact").eq("club_id", club_id).eq("status", "active").execute()
    checklist = [
        {"item": "Registro de atletas en FCP", "estado": "verificar_manualmente"},
        {"item": "Consentimientos parentales menores", "estado": "usar_herramienta_parental_consent"},
        {"item": "Polizas de seguro vigentes", "estado": "usar_herramienta_insurance"},
        {"item": "Documentos medicos actualizados", "estado": "verificar"},
        {"item": "Reglamento interno aprobado", "estado": "verificar_manualmente"},
        {"item": "Habeas data / proteccion de datos", "estado": "verificar_manualmente"},
        {"item": f"Total documentos activos en sistema: {docs.count or 0}", "estado": "informativo"},
        {"item": f"Total atletas activos: {total.count or 0}", "estado": "informativo"},
    ]
    return json.dumps({"checklist": checklist}, ensure_ascii=False)


_SYSTEM_PROMPT = (
    "Eres el Agente Legal y de Cumplimiento de SpeedSkateTrack Hub. "
    "Asistes en el cumplimiento de reglamentos de la FCP (Federacion Colombiana de Patinaje), "
    "proteccion de datos de menores, consentimientos parentales, contratos y documentacion legal. "
    "IMPORTANTE: No das asesoria legal vinculante. Siempre recomienda consultar con un abogado "
    "para decisiones legales especificas. Tu rol es informar sobre el estado de cumplimiento "
    "y alertar sobre documentos pendientes o vencidos. Responde en espanol."
)


class LegalAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_parental_consent_status,
                get_expiring_documents,
                get_insurance_coverage_summary,
                get_regulatory_compliance_checklist,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "legal"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
