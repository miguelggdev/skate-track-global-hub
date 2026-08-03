import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator

from agents.skating_rag.graph import run_rag
from api.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["rag"])


class RagRequest(BaseModel):
    question: str
    context: dict | None = None

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("La pregunta no puede estar vacía")
        if len(v) > 2000:
            raise ValueError("La pregunta no puede superar los 2000 caracteres")
        return v


class RagSource(BaseModel):
    document: str
    page: int | None = None
    excerpt: str


class RagResponse(BaseModel):
    answer: str
    sources: list[RagSource]


@router.post("/query", response_model=RagResponse)
async def query_documents(
    request: RagRequest,
    current_user: dict = Depends(get_current_user),
) -> RagResponse:
    try:
        result = await run_rag(request.question)
    except ValueError as e:
        # Configuración incompleta (ej: OPENAI_API_KEY no seteado)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        logger.exception("Error en pipeline RAG para pregunta: %s", request.question[:100])
        raise HTTPException(
            status_code=503,
            detail="Error al consultar los documentos. Intenta de nuevo en unos momentos.",
        )

    return RagResponse(
        answer=result["answer"],
        sources=[RagSource(**s) for s in result["sources"]],
    )


@router.get("/documents")
async def list_documents(current_user: dict = Depends(get_current_user)) -> dict:
    """Lista los documentos indexados disponibles."""
    from database.supabase_client import get_supabase
    client = get_supabase()
    result = (
        client.table("knowledge_documents")
        .select("id, title, document_type, filename, chunks_count, indexed_at, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return {"documents": result.data or []}
