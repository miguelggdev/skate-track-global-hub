"""
Script CLI para indexar documentos PDF en pgvector.

Uso:
    py -3.11 functions/ingest_documents.py --file reglamento.pdf --title "Reglamento World Skate" --type reglamento
    py -3.11 functions/ingest_documents.py --url https://... --title "Resolución 061 FCP" --type resolucion

El script:
  1. Lee el PDF (local o desde URL)
  2. Extrae texto página por página con pypdf
  3. Divide en chunks de ~500 tokens con 50 de solapamiento
  4. Vectoriza cada chunk con text-embedding-3-small (OpenAI)
  5. Guarda en `document_chunks` de Supabase
  6. Registra el documento en `knowledge_documents`
"""

import argparse
import sys
import os
import math
from datetime import datetime, timezone
from pathlib import Path

# Asegura que el directorio raíz del backend esté en el path
sys.path.insert(0, str(Path(__file__).parent.parent))

import tiktoken
from pypdf import PdfReader
from openai import OpenAI
from database.supabase_client import get_supabase

_EMBEDDING_MODEL = "text-embedding-3-small"
_CHUNK_TOKENS = 500
_CHUNK_OVERLAP = 50
_enc = tiktoken.get_encoding("cl100k_base")
_openai = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


def extract_text_from_pdf(source: str) -> list[dict]:
    """Devuelve lista de {page: int, text: str}."""
    if source.startswith("http"):
        import urllib.request
        try:
            data, _ = urllib.request.urlretrieve(source)
        except Exception as e:
            raise ValueError(f"No se pudo descargar el PDF desde {source}: {e}") from e
        reader = PdfReader(data)
    else:
        reader = PdfReader(source)

    pages = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append({"page": i, "text": text})
    return pages


def chunk_pages(pages: list[dict], document_title: str, filename: str) -> list[dict]:
    """Divide el texto en chunks de ~500 tokens con solapamiento."""
    chunks = []
    buffer_tokens: list[int] = []
    buffer_pages: list[int] = []

    for page in pages:
        tokens = _enc.encode(page["text"])
        for tok in tokens:
            buffer_tokens.append(tok)
            buffer_pages.append(page["page"])
            if len(buffer_tokens) >= _CHUNK_TOKENS:
                chunk_text = _enc.decode(buffer_tokens)
                first_page = buffer_pages[0]
                chunks.append({
                    "content": chunk_text,
                    "metadata": {
                        "document_title": document_title,
                        "filename": filename,
                        "page": first_page,
                    },
                })
                buffer_tokens = buffer_tokens[_CHUNK_TOKENS - _CHUNK_OVERLAP:]
                buffer_pages = buffer_pages[_CHUNK_TOKENS - _CHUNK_OVERLAP:]

    if buffer_tokens:
        chunks.append({
            "content": _enc.decode(buffer_tokens),
            "metadata": {
                "document_title": document_title,
                "filename": filename,
                "page": buffer_pages[0] if buffer_pages else 1,
            },
        })
    return chunks


def embed_batch(texts: list[str]) -> list[list[float]]:
    response = _openai.embeddings.create(model=_EMBEDDING_MODEL, input=texts)
    return [d.embedding for d in response.data]


def ingest(source: str, title: str, doc_type: str, file_url: str = "") -> None:
    print(f"[1/5] Extrayendo texto de: {source}")
    pages = extract_text_from_pdf(source)
    print(f"      {len(pages)} páginas con texto.")

    filename = Path(source).name if not source.startswith("http") else source.split("/")[-1]

    print(f"[2/5] Dividiendo en chunks...")
    chunks = chunk_pages(pages, title, filename)
    print(f"      {len(chunks)} chunks generados.")

    print(f"[3/5] Vectorizando con {_EMBEDDING_MODEL}...")
    batch_size = 100
    all_embeddings: list[list[float]] = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        texts = [c["content"] for c in batch]
        all_embeddings.extend(embed_batch(texts))
        print(f"      Lote {i // batch_size + 1}/{math.ceil(len(chunks) / batch_size)} OK")

    client = get_supabase()

    print(f"[4/5] Guardando en knowledge_documents...")
    doc_result = client.table("knowledge_documents").insert({
        "filename": filename,
        "title": title,
        "document_type": doc_type,
        "file_url": file_url or source,
        "chunks_count": len(chunks),
        "indexed_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    if not doc_result.data:
        raise ValueError("No se pudo insertar el documento en knowledge_documents (respuesta vacía)")
    doc_id = doc_result.data[0]["id"]
    print(f"      document_id = {doc_id}")

    print(f"[5/5] Guardando {len(chunks)} chunks en document_chunks...")
    rows = [
        {
            "document_id": doc_id,
            "content": chunk["content"],
            "embedding": all_embeddings[i],
            "metadata": chunk["metadata"],
        }
        for i, chunk in enumerate(chunks)
    ]
    # Insert in batches of 50
    for i in range(0, len(rows), 50):
        client.table("document_chunks").insert(rows[i:i + 50]).execute()
    print(f"✅ Indexación completada: {len(chunks)} chunks del documento '{title}'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Indexar documento PDF en pgvector")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--file", help="Ruta al archivo PDF local")
    group.add_argument("--url", help="URL del PDF a descargar")
    parser.add_argument("--title", required=True, help="Título del documento")
    parser.add_argument(
        "--type",
        required=True,
        choices=["reglamento", "resolucion", "manual", "planilla", "otro"],
        help="Tipo de documento",
    )
    args = parser.parse_args()

    source = args.file or args.url
    file_url = args.url or ""
    ingest(source=source, title=args.title, doc_type=args.type, file_url=file_url)
