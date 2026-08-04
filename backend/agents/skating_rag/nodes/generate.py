import asyncio
import logging

from anthropic import AsyncAnthropic
from config import settings
from agents.skating_rag.prompts import RAG_SYSTEM_PROMPT, RAG_USER_TEMPLATE

logger = logging.getLogger(__name__)

_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
_NO_CONTEXT_REPLY = "No encontré información sobre eso en los documentos disponibles."


async def generate_node(state: dict) -> dict:
    """Genera la respuesta con Claude usando los chunks recuperados como contexto."""
    question = state["question"]
    chunks: list[dict] = state.get("retrieved_chunks", [])

    if not chunks:
        return {
            "answer": _NO_CONTEXT_REPLY,
            "sources": [],
        }

    context_parts = []
    sources = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk.get("metadata") or {}
        doc_name = meta.get("document_title") or meta.get("filename") or "Documento desconocido"
        page = meta.get("page")
        excerpt = chunk.get("content", "")[:300]

        context_parts.append(
            f"[{i}] Fuente: {doc_name}"
            + (f", pág. {page}" if page else "")
            + f"\n{chunk.get('content', '')}"
        )
        sources.append({
            "document": doc_name,
            "page": page,
            "excerpt": excerpt,
        })

    context_text = "\n\n---\n\n".join(context_parts)
    user_message = RAG_USER_TEMPLATE.format(context=context_text, question=question)

    try:
        response = await asyncio.wait_for(
            _client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=RAG_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            ),
            timeout=45.0,
        )
    except asyncio.TimeoutError:
        logger.warning("generate_node: LLM call timed out after 45 s")
        return {
            "answer": "Lo siento, la respuesta tardó demasiado. Por favor intenta de nuevo.",
            "sources": sources,
        }

    first = response.content[0] if response.content else None
    answer = first.text if (first and hasattr(first, "text")) else _NO_CONTEXT_REPLY
    return {"answer": answer, "sources": sources}
