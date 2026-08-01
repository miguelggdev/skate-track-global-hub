import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from typing import Any

from openai import AsyncOpenAI

from database.supabase_client import get_supabase
from config import settings

_EMBEDDING_MODEL = "text-embedding-3-small"
# Executor dedicado para operaciones Supabase (sync I/O en contexto async)
_db_executor = ThreadPoolExecutor(max_workers=5, thread_name_prefix="supabase_rag")


@lru_cache(maxsize=1)
def _get_openai() -> AsyncOpenAI:
    """Singleton con lru_cache — falla claro si OPENAI_API_KEY no está configurado."""
    if not settings.openai_api_key:
        raise ValueError(
            "OPENAI_API_KEY no está configurado. "
            "Agrega la variable al archivo backend/.env para usar el RAG."
        )
    return AsyncOpenAI(api_key=settings.openai_api_key)


async def embed_text(text: str) -> list[float]:
    response = await _get_openai().embeddings.create(model=_EMBEDDING_MODEL, input=text)
    if not response.data:
        raise ValueError("OpenAI no devolvió embeddings para el texto proporcionado")
    return response.data[0].embedding


async def retrieve_node(state: dict) -> dict:
    """Busca en pgvector los chunks más relevantes para la pregunta."""
    question = state["question"]
    embedding = await embed_text(question)

    # Supabase client es síncrono — lo ejecutamos en thread pool para no bloquear el event loop
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        _db_executor,
        lambda: get_supabase()
        .rpc(
            "match_document_chunks",
            {
                "query_embedding": embedding,
                "match_threshold": 0.70,
                "match_count": 5,
            },
        )
        .execute(),
    )

    chunks: list[dict[str, Any]] = result.data or []
    return {"retrieved_chunks": chunks}
