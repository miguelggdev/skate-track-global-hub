import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from api.limiter import limiter

from agents.admin_agent import AdminAgent
from agents.skating_agent import SkatingAgent
from agents.nutrition_agent import NutritionAgent
from agents.gym_agent import GymAgent
from agents.medical_agent import MedicalAgent
from agents.cycling_agent import CyclingAgent
from agents.psychology_agent import PsychologyAgent
from agents.finance_agent import FinanceAgent
from agents.marketing_agent import MarketingAgent
from agents.results_agent import ResultsAgent
from agents.base_agent import current_user_id as _user_id_ctx, current_user_role as _user_role_ctx
from api.deps import get_current_user, require_roles, _fetch_app_role_async, PRIVILEGED_ROLES

router = APIRouter(prefix="/agents", tags=["agents"])

_registry: dict | None = None
_AGENT_CLASSES = {
    "admin":      AdminAgent,
    "skating":    SkatingAgent,
    "nutrition":  NutritionAgent,
    "gym":        GymAgent,
    "medical":    MedicalAgent,
    "cycling":    CyclingAgent,
    "psychology": PsychologyAgent,
    "finance":    FinanceAgent,
    "marketing":  MarketingAgent,
    "results":    ResultsAgent,
}


def _get_registry() -> dict:
    global _registry
    if _registry is None:
        _registry = {name: cls() for name, cls in _AGENT_CLASSES.items()}
    return _registry

# Agentes que requieren rol privilegiado (admin/coach/leader)
_RESTRICTED_AGENTS = {"admin", "medical", "finance"}


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

    @field_validator("content")
    @classmethod
    def content_max_length(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("Mensaje demasiado largo (máximo 2000 caracteres)")
        return v


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryMessage] = []

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("El mensaje no puede estar vacío")
        if len(v) > 4000:
            raise ValueError("El mensaje no puede superar los 4000 caracteres")
        return v

    @field_validator("history")
    @classmethod
    def validate_history(cls, v: list) -> list:
        if len(v) > 20:
            raise ValueError("El historial no puede superar los 20 mensajes")
        return v


class ChatResponse(BaseModel):
    response: str
    agent_id: str


@router.get("/")
def list_agents(current_user: dict = Depends(get_current_user)) -> dict:
    return {
        "agents": [
            {
                "id": "admin",
                "name": "Asistente Administrativo",
                "description": "Consulta atletas, finanzas y competencias en tiempo real",
                "restricted": True,
            },
            {
                "id": "skating",
                "name": "Experto en Patinaje",
                "description": "Reglas FCP, técnica, entrenamiento, categorías y equipamiento",
                "restricted": False,
            },
            {
                "id": "nutrition",
                "name": "Nutricionista Deportivo",
                "description": "Planes nutricionales, hidratación y suplementación para patinadores",
                "restricted": False,
            },
            {
                "id": "gym",
                "name": "Preparador Físico",
                "description": "Entrenamiento de fuerza, pliometría y prevención de lesiones",
                "restricted": False,
            },
            {
                "id": "medical",
                "name": "Medicina Deportiva",
                "description": "Orientación en salud, lesiones y protocolos de retorno al deporte",
                "restricted": True,
            },
            {
                "id": "cycling",
                "name": "Experto en Ciclismo",
                "description": "Entrenamiento cruzado con bicicleta para potenciar el patinaje",
                "restricted": False,
            },
            {
                "id": "psychology",
                "name": "Psicólogo Deportivo",
                "description": "Preparación mental, manejo de ansiedad y concentración competitiva",
                "restricted": False,
            },
            {
                "id": "finance",
                "name": "Asesor Financiero",
                "description": "Ingresos, egresos, pagos pendientes y metas económicas del club",
                "restricted": True,
            },
            {
                "id": "marketing",
                "name": "Marketing y Comunicación",
                "description": "Contenido para redes sociales, comunicados y estrategias de crecimiento",
                "restricted": False,
            },
            {
                "id": "results",
                "name": "Analista de Resultados",
                "description": "Resultados de competencias, rankings, historial y análisis de rendimiento",
                "restricted": False,
            },
        ]
    }


@router.post("/{agent_id}/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat_with_agent(
    http_request: Request,
    agent_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
) -> ChatResponse:
    registry = _get_registry()
    agent = registry.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agente '{agent_id}' no encontrado. Disponibles: {list(registry.keys())}",
        )

    user_id = current_user.get("sub", "")
    app_role = await _fetch_app_role_async(user_id)

    if agent_id in _RESTRICTED_AGENTS and app_role not in PRIVILEGED_ROLES:
        raise HTTPException(status_code=403, detail="Sin acceso al agente administrativo")

    _user_id_ctx.set(user_id)
    _user_role_ctx.set(app_role or "")

    history = [h.model_dump() for h in request.history]
    response = await agent.chat(request.message, history)
    return ChatResponse(response=response, agent_id=agent_id)


@router.post("/{agent_id}/chat/stream")
@limiter.limit("20/minute")
async def stream_chat_with_agent(
    http_request: Request,
    agent_id: str,
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
) -> StreamingResponse:
    """SSE — devuelve tokens a medida que Claude los genera."""
    registry = _get_registry()
    agent = registry.get(agent_id)
    if not agent:
        raise HTTPException(
            status_code=404,
            detail=f"Agente '{agent_id}' no encontrado. Disponibles: {list(registry.keys())}",
        )

    user_id = current_user.get("sub", "")
    app_role = await _fetch_app_role_async(user_id)

    if agent_id in _RESTRICTED_AGENTS and app_role not in PRIVILEGED_ROLES:
        raise HTTPException(status_code=403, detail="Sin acceso al agente administrativo")

    _user_id_ctx.set(user_id)
    _user_role_ctx.set(app_role or "")

    history = [h.model_dump() for h in request.history]

    async def event_generator():
        if hasattr(agent, "stream_chat"):
            async for token in agent.stream_chat(request.message, history):
                yield f"data: {json.dumps({'token': token})}\n\n"
        else:
            full_response = await agent.chat(request.message, history)
            yield f"data: {json.dumps({'token': full_response})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
