from typing import TypedDict, Any
from langgraph.graph import StateGraph, START, END
from agents.skating_rag.nodes.retrieve import retrieve_node
from agents.skating_rag.nodes.generate import generate_node


class RagState(TypedDict):
    question: str
    retrieved_chunks: list[dict[str, Any]]
    answer: str
    sources: list[dict[str, Any]]


def _build_graph() -> Any:
    workflow = StateGraph(RagState)
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("generate", generate_node)
    workflow.add_edge(START, "retrieve")
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", END)
    return workflow.compile()


# Compiled graph — importar este objeto en el endpoint
rag_graph = _build_graph()


async def run_rag(question: str) -> dict[str, Any]:
    """Entry point: ejecuta el grafo RAG y devuelve answer + sources."""
    result = await rag_graph.ainvoke({
        "question": question,
        "retrieved_chunks": [],
        "answer": "",
        "sources": [],
    })
    return {"answer": result["answer"], "sources": result["sources"]}
