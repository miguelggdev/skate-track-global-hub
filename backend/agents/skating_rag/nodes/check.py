from __future__ import annotations
import logging
from anthropic import AsyncAnthropic
from config import settings

logger = logging.getLogger(__name__)

_CHECK_PROMPT = (
    "You are a factual accuracy checker.\n"
    "Given the following context and an answer, determine if the answer is supported by the context.\n\n"
    "Context:\n{context}\n\n"
    "Answer:\n{answer}\n\n"
    "Is the answer fully supported by the context above? Respond with only YES or NO."
)

_DISCLAIMER_ES = (
    "\n\n⚠️ *Nota: Esta respuesta puede contener información no respaldada completamente "
    "por los documentos disponibles. Por favor verifica con fuentes oficiales.*"
)
_DISCLAIMER_EN = (
    "\n\n⚠️ *Note: This response may contain information not fully supported by the "
    "available documents. Please verify with official sources.*"
)


async def check_hallucination_node(state: dict) -> dict:
    """Verify the generated answer is grounded in the retrieved documents."""
    documents: list[dict] = state.get("retrieved_chunks", [])
    answer: str = state.get("answer", "")

    if not documents or not answer:
        return {}  # Nothing to check — leave state unchanged

    context = "\n---\n".join(
        doc.get("content", str(doc))[:1000] for doc in documents[:4]
    )

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=5,
            messages=[
                {
                    "role": "user",
                    "content": _CHECK_PROMPT.format(context=context, answer=answer),
                }
            ],
        )
        raw = response.content[0].text.strip().upper() if response.content else "YES"
        is_grounded = raw.startswith("YES")
    except Exception as exc:
        logger.warning("Hallucination check failed: %s — adding disclaimer as precaution", exc)
        is_grounded = False

    if not is_grounded:
        disclaimer = _DISCLAIMER_ES if _is_spanish(answer) else _DISCLAIMER_EN
        flagged_answer = answer + disclaimer
        logger.info("Hallucination check: answer flagged as potentially ungrounded")
        return {"answer": flagged_answer}

    return {}  # Answer is grounded — no change needed


def _is_spanish(text: str) -> bool:
    es_markers = {"de", "la", "el", "en", "los", "las", "con", "por", "para", "que"}
    words = set(text.lower().split()[:30])
    return len(words & es_markers) >= 3
