import json
from datetime import datetime, timedelta

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent
from database.supabase_client import get_supabase


@tool
def get_athletes_summary() -> str:
    """Obtiene estadísticas de atletas del club: total, activos, por categoría y por entrenador."""
    client = get_supabase()
    total_res = client.table("athletes").select("id", count="exact").execute()
    active_res = client.table("athletes").select("id", count="exact").eq("status", "active").execute()
    cat_res = client.table("athletes").select("category").limit(1000).execute()
    total = total_res.count or 0
    active = active_res.count or 0
    categories: dict[str, int] = {}
    for a in cat_res.data or []:
        cat = a.get("category") or "Sin categoría"
        categories[cat] = categories.get(cat, 0) + 1
    return json.dumps(
        {"total": total, "activos": active, "inactivos": total - active, "por_categoria": categories},
        ensure_ascii=False,
    )


@tool
def get_financial_summary() -> str:
    """Obtiene el resumen financiero del mes actual: ingresos, egresos y balance."""
    client = get_supabase()
    now = datetime.now()
    start = f"{now.year}-{now.month:02d}-01"
    result = (
        client.table("financial_transactions")
        .select("amount, transaction_type, description, transaction_date")
        .gte("transaction_date", start)
        .execute()
    )
    transactions = result.data or []
    income = sum(float(t.get("amount", 0)) for t in transactions if t.get("transaction_type") == "income")
    expense = sum(float(t.get("amount", 0)) for t in transactions if t.get("transaction_type") == "expense")
    return json.dumps(
        {
            "mes": f"{now.year}-{now.month:02d}",
            "ingresos": income,
            "egresos": expense,
            "balance": income - expense,
            "total_transacciones": len(transactions),
        },
        ensure_ascii=False,
    )


@tool
def get_upcoming_competitions() -> str:
    """Lista las próximas 5 competencias programadas desde hoy."""
    client = get_supabase()
    today = datetime.now().date().isoformat()
    result = (
        client.table("competitions")
        .select("name, start_date, location, competition_level, max_participants")
        .gte("start_date", today)
        .order("start_date")
        .limit(5)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


@tool
def get_training_sessions_summary() -> str:
    """Obtiene las sesiones de entrenamiento de los últimos 7 días y las próximas 7 días."""
    client = get_supabase()
    week_ago = (datetime.now() - timedelta(days=7)).isoformat()
    week_ahead = (datetime.now() + timedelta(days=7)).isoformat()
    result = (
        client.table("training_sessions")
        .select("id, title, scheduled_at, status, max_participants")
        .gte("scheduled_at", week_ago)
        .lte("scheduled_at", week_ahead)
        .order("scheduled_at")
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


_SYSTEM_PROMPT = """Eres el Asistente Administrativo del Club de Patinaje. Ayudas a los administradores \
a consultar y gestionar información del club de manera eficiente y profesional.

Tienes acceso a herramientas que consultan la base de datos en tiempo real. Úsalas cuando el usuario pregunte sobre:
- Atletas: estadísticas, categorías, estado activo/inactivo
- Finanzas: ingresos, egresos, balance del mes
- Competencias: próximos eventos programados
- Entrenamientos: sesiones recientes y futuras

Reglas:
- Responde siempre en español
- Si los datos están vacíos, informa que no hay registros disponibles
- Presenta los números con formato legible (ej: $1.500.000 COP)
- Si no tienes una herramienta para responder algo, dilo claramente y sugiere cómo obtener esa información
"""


class AdminAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        # Grafo compilado una vez al iniciar — no recrear en cada llamada
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_athletes_summary,
                get_financial_summary,
                get_upcoming_competitions,
                get_training_sessions_summary,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "admin"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
