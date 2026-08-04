from __future__ import annotations
import asyncio
import logging
from anthropic import AsyncAnthropic
from config import settings

logger = logging.getLogger(__name__)

_RERANK_PROMPT = (
    "Rate the relevance of the following document chunk to the user query.\n"
    "Query: {query}\n"
    "Chunk: {chunk}\n\n"
    "Respond with only a single integer from 0 to 10."
)


async def _score_chunk(client: AsyncAnthropic, question: str, doc: dict) -> tuple[float, dict]:
    """Score a single chunk for relevance. Returns (score, doc)."""
    chunk_text = doc.get("content", str(doc))[:2000]
    try:
        response = await asyncio.wait_for(
            client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=10,
                messages=[
                    {
                        "role": "user",
                        "content": _RERANK_PROMPT.format(
                            query=question[:200], chunk=chunk_text
                        ),
                    }
                ],
            ),
            timeout=8.0,
        )
        raw = response.content[0].text.strip().split()[0] if response.content else "0"
        score = float(raw)
    except Exception as exc:
        logger.debug("Rerank scoring failed for chunk: %s", exc)
        score = 0.0
    return (score, doc)


async def rerank_node(state: dict) -> dict:
    """Re-rank retrieved documents by relevance using Claude Haiku as scorer."""
    question: str = state.get("question", "")
    documents: list[dict] = state.get("retrieved_chunks", [])

    if not documents or len(documents) <= 2:
        return {}  # Nothing to rerank — return empty dict to leave state unchanged

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    results = await asyncio.gather(*[
        _score_chunk(client, question, doc)
        for doc in documents
    ])

    scored = sorted(results, key=lambda x: x[0], reverse=True)
    top_docs = [doc for _, doc in scored[:5]]
    return {"retrieved_chunks": top_docs}
