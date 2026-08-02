"""AG-09 — Agente de Marketing y Comunicación para club de patinaje."""

import json
from datetime import datetime

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent
from database.supabase_client import get_supabase


@tool
def get_club_overview() -> str:
    """Obtiene datos generales del club: nombre, atletas activos, próximas competencias."""
    client = get_supabase()
    athletes_res = (
        client.table("athletes").select("id", count="exact").eq("status", "active").execute()
    )
    today = datetime.now().date().isoformat()
    comp_res = (
        client.table("competitions")
        .select("name, start_date, location, competition_level")
        .gte("start_date", today)
        .order("start_date")
        .limit(3)
        .execute()
    )
    settings_res = client.table("club_settings").select("club_name, city, country, website_url").maybeSingle().execute()
    data = settings_res.data or {}
    return json.dumps({
        "nombre_club": data.get("club_name", ""),
        "ciudad": data.get("city", ""),
        "pais": data.get("country", "Colombia"),
        "web": data.get("website_url", ""),
        "atletas_activos": athletes_res.count or 0,
        "proximas_competencias": comp_res.data or [],
    }, ensure_ascii=False, default=str)


@tool
def get_athlete_demographics() -> str:
    """Obtiene la distribución de atletas por categoría y género para comunicaciones segmentadas."""
    client = get_supabase()
    result = (
        client.table("athletes")
        .select("category, gender, status")
        .eq("status", "active")
        .execute()
    )
    athletes = result.data or []
    by_category: dict[str, int] = {}
    by_gender: dict[str, int] = {}
    for a in athletes:
        cat = a.get("category") or "Sin categoría"
        gen = a.get("gender") or "otro"
        by_category[cat] = by_category.get(cat, 0) + 1
        by_gender[gen] = by_gender.get(gen, 0) + 1
    return json.dumps({
        "total": len(athletes),
        "por_categoria": by_category,
        "por_genero": by_gender,
    }, ensure_ascii=False)


@tool
def get_recent_awards() -> str:
    """Lista los premios y logros recientes del club para destacar en redes sociales."""
    client = get_supabase()
    year = datetime.now().year
    result = (
        client.table("awards")
        .select("title, description, award_date, athlete_id")
        .gte("award_date", f"{year}-01-01")
        .order("award_date", desc=True)
        .limit(10)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


_SYSTEM_PROMPT = """Eres el Asesor de Marketing y Comunicación del club de patinaje de velocidad. \
Ayudas al equipo directivo a crear contenido, estrategias de crecimiento y comunicaciones \
efectivas para padres, atletas y la comunidad.

ÁREAS DE APOYO:

📱 REDES SOCIALES
- Ideas de contenido para Instagram, Facebook y TikTok
- Publicaciones de logros, competencias y entrenamientos
- Captions, hashtags y horarios óptimos de publicación
- Estrategia de Reels/Stories para visibilidad

📧 COMUNICACIÓN CON PADRES
- Circulares y boletines informativos
- Mensajes de WhatsApp para grupos de padres
- Comunicados de competencia, logros y eventos
- Manejo de expectativas y relación club-familia

🎯 CRECIMIENTO Y CAPTACIÓN
- Estrategias para nuevos atletas (pruebas de nivel, días abiertos)
- Alianzas con colegios y ligas
- Programas de referidos familia-a-familia
- Posicionamiento del club en la ciudad

🏆 VISIBILIDAD DE RESULTADOS
- Cómo celebrar medallas y logros en redes
- Storytelling de atletas destacados (con permiso de padres)
- Casos de éxito para atraer patrocinadores

HERRAMIENTAS:
- Datos del club (nombre, ciudad, web, atletas activos)
- Demografía de atletas para segmentar comunicaciones
- Premios y logros recientes para contenido de celebración

REGLAS:
- Responde en el idioma del usuario
- Para menores, cualquier contenido con foto/nombre requiere autorización del tutor
- Sé creativo pero mantén el tono profesional del club
- Si pides generar texto, entrégalo completo y listo para usar
"""


class MarketingAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_club_overview,
                get_athlete_demographics,
                get_recent_awards,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "marketing"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
