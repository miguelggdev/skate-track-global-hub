"""AG-10 — Agente de Resultados y Análisis Competitivo."""

import json
from datetime import datetime

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent, current_user_id, current_user_role, current_club_id
from database.supabase_client import get_supabase

_STAFF_ROLES = {"admin", "coach", "leader"}


@tool
def get_competition_results(competition_id: str) -> str:
    """Obtiene los resultados registrados de una competencia específica."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    comp = (
        client.table("competitions")
        .select("id")
        .eq("id", competition_id)
        .eq("club_id", club_id)
        .limit(1)
        .execute()
    )
    if not comp.data:
        return json.dumps({"error": "Competencia no encontrada"}, ensure_ascii=False)
    result = (
        client.table("competition_results")
        .select("position, time_seconds, medal_type, athlete_id, category, gender, event_name")
        .eq("competition_id", competition_id)
        .order("position")
        .execute()
    )
    results = result.data or []
    medals = {"gold": 0, "silver": 0, "bronze": 0}
    for r in results:
        mt = r.get("medal_type")
        if mt in medals:
            medals[mt] += 1
    return json.dumps({
        "total_resultados": len(results),
        "medallas": medals,
        "resultados": results,
    }, ensure_ascii=False, default=str)


@tool
def get_competitions_list(year: int = 0) -> str:
    """Lista las competencias del año (0 = año actual) con su estado."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    target_year = year if year > 0 else datetime.now().year
    result = (
        client.table("competitions")
        .select("id, name, start_date, location, competition_level, status")
        .eq("club_id", club_id)
        .gte("start_date", f"{target_year}-01-01")
        .lte("start_date", f"{target_year}-12-31")
        .order("start_date")
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


@tool
def get_athlete_results_history(athlete_id: str) -> str:
    """Obtiene el historial de resultados competitivos de un atleta."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    role = current_user_role.get()
    uid = current_user_id.get()
    own = client.table("athletes").select("user_id, club_id").eq("id", athlete_id).limit(1).execute()
    if not own.data or own.data[0].get("club_id") != club_id:
        return json.dumps({"error": "Sin permiso para ver este historial"}, ensure_ascii=False)
    if role not in _STAFF_ROLES and own.data[0].get("user_id") != uid:
        # Atletas solo pueden ver su propio historial
        return json.dumps({"error": "Sin permiso para ver este historial"}, ensure_ascii=False)
    result = (
        client.table("competition_results")
        .select("position, time_seconds, medal_type, category, gender, event_name, competition_id")
        .eq("athlete_id", athlete_id)
        .order("competition_id", desc=True)
        .limit(20)
        .execute()
    )
    results = result.data or []
    medals = {"gold": 0, "silver": 0, "bronze": 0}
    top3 = 0
    for r in results:
        mt = r.get("medal_type")
        if mt in medals:
            medals[mt] += 1
        if r.get("position") and r["position"] <= 3:
            top3 += 1
    return json.dumps({
        "total_competencias": len(results),
        "medallas": medals,
        "veces_top3": top3,
        "historial": results,
    }, ensure_ascii=False, default=str)


@tool
def get_club_ranking_summary() -> str:
    """Obtiene el ranking general del club: atletas con más medallas en el año."""
    club_id = current_club_id.get()
    if not club_id:
        return json.dumps({"error": "Club no resuelto"}, ensure_ascii=False)
    client = get_supabase()
    year = datetime.now().year
    comp_rows = (
        client.table("competitions")
        .select("id")
        .eq("club_id", club_id)
        .gte("start_date", f"{year}-01-01")
        .lte("start_date", f"{year}-12-31")
        .execute()
    ).data or []
    comp_ids = [c["id"] for c in comp_rows] or ["00000000-0000-0000-0000-000000000000"]
    result = (
        client.table("competition_results")
        .select("athlete_id, medal_type")
        .not_.is_("medal_type", None)
        .in_("competition_id", comp_ids)
        .execute()
    )
    medals_by_athlete: dict[str, dict] = {}
    for r in result.data or []:
        aid = r.get("athlete_id")
        mt = r.get("medal_type")
        if not aid or not mt:
            continue
        if aid not in medals_by_athlete:
            medals_by_athlete[aid] = {"gold": 0, "silver": 0, "bronze": 0, "total": 0}
        if mt in medals_by_athlete[aid]:
            medals_by_athlete[aid][mt] += 1
            medals_by_athlete[aid]["total"] += 1
    ranking = sorted(medals_by_athlete.items(), key=lambda x: (
        x[1]["gold"], x[1]["silver"], x[1]["bronze"]
    ), reverse=True)[:10]
    return json.dumps({
        "año": year,
        "top_atletas": [{"athlete_id": aid, **data} for aid, data in ranking],
    }, ensure_ascii=False)


_SYSTEM_PROMPT = """Eres el Analista de Resultados Competitivos del club de patinaje de velocidad. \
Analizas el rendimiento en competencias, historiales de atletas, rankings y tendencias \
para ayudar a entrenadores y directivos a tomar decisiones basadas en datos.

ÁREAS DE ANÁLISIS:

🏆 RESULTADOS POR COMPETENCIA
- Posiciones y tiempos obtenidos en cada evento
- Medallero del club por competencia
- Comparativo de rendimiento entre competencias

📈 EVOLUCIÓN DEL ATLETA
- Historial de resultados individuales
- Tendencias de mejora o estancamiento
- Comparativo vs. tiempos de referencia FCP

🥇 RANKINGS Y MEDALLERO
- Top atletas del club por medallas y posiciones
- Rendimiento por categoría y género
- Identificación de talentos emergentes

🎯 ANÁLISIS TÁCTICO
- Qué eventos generan más medallas
- Categorías con mayor potencial de crecimiento
- Recomendaciones de enfoque para próximas competencias

HERRAMIENTAS:
- Resultados de competencia específica (por ID)
- Lista de competencias del año
- Historial de resultados de atleta individual
- Ranking general del club

REGLAS:
- Responde en el idioma del usuario
- Presenta tiempos en formato mm:ss.cc cuando sea relevante
- No hagas comparaciones negativas entre atletas — enfócate en el progreso individual
- Las medallas importan, pero el progreso del tiempo también es un logro
"""


class ResultsAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_competition_results,
                get_competitions_list,
                get_athlete_results_history,
                get_club_ranking_summary,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "results"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
