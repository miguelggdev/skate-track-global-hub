#!/usr/bin/env python3
"""Genera y carga 500 frases motivadoras usando Claude API.

Uso:
    cd backend
    python scripts/seed_motivational_phrases.py

Requiere:
    ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY en .env

El script genera 100 frases por categoría (5 categorías) y las inserta
en la tabla motivational_phrases. Las 50 del seed SQL no se duplican
porque usa INSERT ... ON CONFLICT DO NOTHING.
"""
from __future__ import annotations

import json
import os
import sys
import time

import anthropic
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]

CATEGORIES: dict[str, str] = {
    "motivacion": "motivación, superación personal, alcanzar metas, nunca rendirse",
    "disciplina": "disciplina, constancia, hábitos, esfuerzo diario, trabajo duro",
    "equipo":     "trabajo en equipo, compañerismo, unidad, apoyo mutuo entre deportistas",
    "tecnica":    "mejora técnica, perfección del movimiento, análisis deportivo, detalle y precisión",
    "vida":       "valores deportivos, carácter, humildad, respeto, el deporte como escuela de vida",
}

PROMPT_TEMPLATE = """Eres un experto en psicología deportiva y frases motivadoras en español para atletas de patinaje de velocidad.

Genera exactamente {count} frases ORIGINALES sobre el tema: {topic}.

Reglas:
- En español colombiano natural
- Cortas y poderosas (máximo 2 líneas)
- Específicas para atletas de deportes de velocidad y resistencia
- Variadas: no repitas estructuras
- Puedes incluir el autor real si la frase es de alguien famoso, si no, deja author como null
- NO numeres las frases
- NO uses comillas en el campo phrase (van sin comillas)

Responde ÚNICAMENTE con un array JSON válido, sin texto adicional:
[
  {{"phrase": "texto de la frase", "author": "Nombre o null"}},
  ...
]"""


def generate_phrases(category: str, topic: str, count: int = 90) -> list[dict]:
    """Genera frases con Claude y devuelve lista de dicts {phrase, author}."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    prompt = PROMPT_TEMPLATE.format(count=count, topic=topic)

    print(f"  Generando {count} frases para '{category}'...")
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()

    # Extraer JSON si Claude añade texto antes/después
    start = raw.find("[")
    end   = raw.rfind("]") + 1
    if start == -1 or end == 0:
        print(f"  ERROR: respuesta no es JSON válido para '{category}'")
        return []

    try:
        phrases = json.loads(raw[start:end])
        return [
            {"phrase": p["phrase"], "author": p.get("author"), "category": category}
            for p in phrases
            if p.get("phrase")
        ]
    except json.JSONDecodeError as e:
        print(f"  ERROR JSON para '{category}': {e}")
        return []


def insert_phrases(db, phrases: list[dict]) -> int:
    """Inserta frases ignorando duplicados exactos. Devuelve count insertado."""
    if not phrases:
        return 0
    # Supabase no soporta ON CONFLICT en el cliente, lo hacemos en batches
    inserted = 0
    batch_size = 50
    for i in range(0, len(phrases), batch_size):
        batch = phrases[i : i + batch_size]
        try:
            res = db.table("motivational_phrases").upsert(
                batch,
                on_conflict="phrase",   # requiere UNIQUE(phrase) o ignoramos errores
                ignore_duplicates=True,
            ).execute()
            inserted += len(res.data or [])
        except Exception as exc:
            # Insertar uno a uno si falla el batch
            for row in batch:
                try:
                    db.table("motivational_phrases").insert(row).execute()
                    inserted += 1
                except Exception:
                    pass  # duplicado exacto — ignorar
    return inserted


def main() -> None:
    db = create_client(SUPABASE_URL, SUPABASE_KEY)

    total_inserted = 0
    all_phrases: list[dict] = []

    for category, topic in CATEGORIES.items():
        phrases = generate_phrases(category, topic, count=90)
        all_phrases.extend(phrases)
        print(f"  Generadas: {len(phrases)}")
        time.sleep(2)  # evitar rate limit de Anthropic

    print(f"\nTotal generadas: {len(all_phrases)}")
    print("Insertando en BD...")
    total_inserted = insert_phrases(db, all_phrases)
    print(f"Insertadas: {total_inserted} frases (duplicados ignorados)")

    # Verificar conteo final
    count_res = db.table("motivational_phrases").select("id", count="exact").execute()
    total_in_db = count_res.count or 0
    print(f"Total en BD ahora: {total_in_db} frases")


if __name__ == "__main__":
    main()
