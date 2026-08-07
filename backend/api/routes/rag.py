import io
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, field_validator

from agents.skating_rag.graph import run_rag
from agents.skating_rag.nodes.retrieve import embed_text
from api.deps import _fetch_app_role_async, get_current_user
from api.limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/rag", tags=["rag"])

_MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB
_CHUNK_SIZE = 1000
_CHUNK_OVERLAP = 100


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


def _extract_text(file_bytes: bytes, content_type: str) -> str:
    if "pdf" in content_type:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return file_bytes.decode("utf-8", errors="replace")


def _chunk_text(text: str) -> list[str]:
    chunks: list[str] = []
    text = text.strip()
    start = 0
    while start < len(text):
        end = min(start + _CHUNK_SIZE, len(text))
        if end < len(text):
            for sep in (". ", ".\n", "\n\n", "\n"):
                pos = text.rfind(sep, start + _CHUNK_OVERLAP, end)
                if pos > start:
                    end = pos + len(sep)
                    break
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - _CHUNK_OVERLAP
    return chunks


@router.post("/query", response_model=RagResponse)
@limiter.limit("20/minute")
async def query_documents(
    http_request: Request,
    request: RagRequest,
    current_user: dict = Depends(get_current_user),
) -> RagResponse:
    try:
        result = await run_rag(request.question)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        logger.exception("Error en pipeline RAG: %s", request.question[:100])
        raise HTTPException(
            status_code=503,
            detail="Error al consultar los documentos. Intenta de nuevo.",
        )
    return RagResponse(
        answer=result["answer"],
        sources=[RagSource(**s) for s in result["sources"]],
    )


@router.get("/documents")
async def list_documents(current_user: dict = Depends(get_current_user)) -> dict:
    from database.supabase_client import get_supabase
    result = (
        get_supabase()
        .table("knowledge_documents")
        .select("id, title, document_type, filename, chunks_count, indexed_at, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return {"documents": result.data or []}


@router.post("/upload")
@limiter.limit("5/minute")
async def upload_document(
    http_request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: str = Form("otro"),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Index a PDF/TXT into pgvector for RAG. Admin/Leader only."""
    user_id = current_user.get("sub", "")
    role = await _fetch_app_role_async(user_id)
    if role not in ("admin", "leader"):
        raise HTTPException(status_code=403, detail="Solo administradores pueden subir documentos")

    valid_types = ("reglamento", "resolucion", "manual", "planilla", "otro")
    if document_type not in valid_types:
        document_type = "otro"

    content_type = file.content_type or ""
    if not any(t in content_type for t in ("pdf", "text", "markdown")):
        raise HTTPException(status_code=400, detail="Solo se aceptan PDF, TXT o Markdown")

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="El archivo no puede superar 10 MB")

    try:
        text = _extract_text(file_bytes, content_type)
    except Exception as exc:
        logger.error("Text extraction failed for %s: %s", file.filename, exc)
        raise HTTPException(status_code=422, detail="No se pudo extraer texto del archivo")

    if not text.strip():
        raise HTTPException(status_code=422, detail="El archivo no contiene texto extraíble")

    chunks = _chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No se generaron fragmentos del documento")

    from database.supabase_client import get_supabase
    db = get_supabase()

    doc_res = db.table("knowledge_documents").insert({
        "filename": file.filename or "documento.pdf",
        "title": title.strip(),
        "document_type": document_type,
        "file_url": "",
        "chunks_count": 0,
        "created_by": user_id,
    }).execute()
    doc_id = doc_res.data[0]["id"]

    chunk_rows: list[dict] = []
    failed = 0
    for idx, chunk_content in enumerate(chunks):
        try:
            embedding = await embed_text(chunk_content)
            chunk_rows.append({
                "document_id": doc_id,
                "content": chunk_content,
                "chunk_index": idx,
                "embedding": embedding,
                "metadata": {
                    "title": title,
                    "document_type": document_type,
                    "filename": file.filename,
                    "chunk_index": idx,
                    "total_chunks": len(chunks),
                },
            })
        except Exception as exc:
            logger.error("Embedding failed chunk %d/%d: %s", idx, len(chunks), exc)
            failed += 1

    if chunk_rows:
        db.table("document_chunks").insert(chunk_rows).execute()

    db.table("knowledge_documents").update({
        "chunks_count": len(chunk_rows),
        "indexed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", doc_id).execute()

    logger.info("RAG upload: doc=%s chunks=%d failed=%d", doc_id, len(chunk_rows), failed)
    return {
        "id": doc_id,
        "title": title,
        "chunks_indexed": len(chunk_rows),
        "chunks_failed": failed,
    }


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Delete document and cascade-delete its chunks. Admin/Leader only."""
    user_id = current_user.get("sub", "")
    role = await _fetch_app_role_async(user_id)
    if role not in ("admin", "leader"):
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar documentos")

    from database.supabase_client import get_supabase
    get_supabase().table("knowledge_documents").delete().eq("id", document_id).execute()
    return {"deleted": True}
