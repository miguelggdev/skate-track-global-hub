"""AG-07 — Agente Financiero para club de patinaje de velocidad."""

import json
from datetime import datetime, timedelta

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent
from database.supabase_client import get_supabase


@tool
def get_monthly_summary(months_back: int = 0) -> str:
    """Obtiene ingresos, egresos y balance de un mes. months_back=0 es el mes actual."""
    client = get_supabase()
    months_back = max(0, int(months_back))
    now = datetime.now()
    year = now.year
    month = now.month - months_back
    while month <= 0:
        month += 12
        year -= 1
    start = f"{year}-{month:02d}-01"
    end_day = (datetime(year, month % 12 + 1, 1) - timedelta(days=1)).day if month != 12 else 31
    end = f"{year}-{month:02d}-{end_day:02d}"

    result = (
        client.table("financial_transactions")
        .select("amount, transaction_type, description, transaction_date, payment_status")
        .gte("transaction_date", start)
        .lte("transaction_date", end)
        .execute()
    )
    transactions = result.data or []
    income = sum(float(t.get("amount", 0)) for t in transactions if t.get("transaction_type") == "income")
    expense = sum(float(t.get("amount", 0)) for t in transactions if t.get("transaction_type") == "expense")
    pending = sum(float(t.get("amount", 0)) for t in transactions if t.get("payment_status") == "pending")
    return json.dumps({
        "mes": f"{year}-{month:02d}",
        "ingresos": income,
        "egresos": expense,
        "balance": income - expense,
        "pendientes": pending,
        "total_transacciones": len(transactions),
    }, ensure_ascii=False)


@tool
def get_pending_payments() -> str:
    """Lista los pagos pendientes de cobro: inscripciones y cuotas sin pagar."""
    client = get_supabase()
    result = (
        client.table("financial_transactions")
        .select("id, amount, transaction_type, description, transaction_date, payment_status")
        .eq("payment_status", "pending")
        .order("transaction_date", desc=False)
        .limit(30)
        .execute()
    )
    items = result.data or []
    total = sum(float(t.get("amount", 0)) for t in items)
    return json.dumps({
        "total_pendiente": total,
        "cantidad": len(items),
        "pagos": items,
    }, ensure_ascii=False, default=str)


@tool
def get_annual_revenue() -> str:
    """Obtiene el resumen de ingresos y egresos del año en curso, mes a mes."""
    client = get_supabase()
    year = datetime.now().year
    result = (
        client.table("financial_transactions")
        .select("amount, transaction_type, transaction_date")
        .gte("transaction_date", f"{year}-01-01")
        .lte("transaction_date", f"{year}-12-31")
        .execute()
    )
    monthly: dict[int, dict] = {m: {"ingresos": 0, "egresos": 0} for m in range(1, 13)}
    for t in result.data or []:
        date_str = t.get("transaction_date", "")
        if not date_str:
            continue
        try:
            m = int(date_str[5:7])
        except (ValueError, IndexError):
            continue
        amount = float(t.get("amount", 0))
        if t.get("transaction_type") == "income":
            monthly[m]["ingresos"] += amount
        else:
            monthly[m]["egresos"] += amount
    return json.dumps({
        "año": year,
        "meses": [{"mes": m, **v} for m, v in monthly.items()],
    }, ensure_ascii=False)


@tool
def get_club_settings_targets() -> str:
    """Obtiene las metas financieras y de atletas configuradas en el club."""
    client = get_supabase()
    result = client.table("club_settings").select("target_athletes, target_revenue, club_name").maybeSingle().execute()
    data = result.data or {}
    return json.dumps({
        "meta_atletas": data.get("target_athletes", 50),
        "meta_ingresos": float(data.get("target_revenue", 10000)),
        "nombre_club": data.get("club_name", ""),
    }, ensure_ascii=False)


_SYSTEM_PROMPT = """Eres el Asesor Financiero del club de patinaje de velocidad. \
Apoyas al administrador, líder y área financiera con análisis de ingresos, egresos, \
presupuestos y metas económicas del club.

ÁREAS DE ANÁLISIS:
- Flujo de caja mensual y anual
- Pagos pendientes e indicadores de morosidad
- Comparativo vs. metas de ingresos configuradas
- Alertas de gastos inusuales

HERRAMIENTAS:
- Resumen financiero mensual (ingresos / egresos / balance / pendientes)
- Lista de pagos pendientes de cobro
- Ingresos anuales mes a mes
- Metas configuradas del club

REGLAS:
- Responde en el idioma del usuario
- Presenta cifras con separadores de miles y símbolo de moneda (COP)
- Si el balance es negativo, alerta con claridad y sugiere acciones
- No proporciones asesoría fiscal o legal — sugiere consultar un contador
"""


class FinanceAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_monthly_summary,
                get_pending_payments,
                get_annual_revenue,
                get_club_settings_targets,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "finance"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
