"""Endpoints de gestión de atletas — actualmente importación CSV."""
from __future__ import annotations

import csv
import io
import logging
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from api.deps import get_current_user, _fetch_role_and_club_async
from database.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/athletes", tags=["athletes"])

# ── Columnas esperadas en el CSV ──────────────────────────────────────────────
# Obligatorias: first_name, last_name
# Opcionales: email, phone, date_of_birth (YYYY-MM-DD), category, status
_REQUIRED_COLS = {"first_name", "last_name"}
_OPTIONAL_COLS = {"email", "phone", "date_of_birth", "category", "status",
                  "gender", "nationality", "emergency_contact", "emergency_phone"}
_ALL_COLS       = _REQUIRED_COLS | _OPTIONAL_COLS

_VALID_CATEGORIES = {
    "escuela", "menores", "transicion", "prejuvenil",
    "juvenil", "mayores", "master",
}
_VALID_STATUSES = {"active", "inactive", "injured", "suspended"}


class ImportResult(BaseModel):
    inserted: int
    skipped:  int
    errors:   list[str]


@router.post(
    "/import/csv",
    response_model=ImportResult,
    status_code=status.HTTP_200_OK,
    summary="Importar atletas desde CSV",
    description=(
        "Importa atletas desde un archivo CSV. Columnas obligatorias: "
        "`first_name`, `last_name`. Opcionales: `email`, `phone`, "
        "`date_of_birth` (YYYY-MM-DD), `category`, `status`."
    ),
)
async def import_athletes_csv(
    file: Annotated[UploadFile, File(description="Archivo CSV (max 2 MB)")],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> ImportResult:
    # Solo admins pueden importar — verificar rol real en BD (JWT role siempre es "authenticated")
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token sin sub claim")
    app_role, club_id = await _fetch_role_and_club_async(user_id)
    if app_role != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden importar atletas.")
    if not club_id:
        raise HTTPException(status_code=403, detail="Usuario sin club asignado")

    if file.content_type not in {"text/csv", "application/csv", "text/plain"}:
        raise HTTPException(status_code=400, detail="El archivo debe ser CSV (text/csv).")

    raw = await file.read()
    if len(raw) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo no puede superar 2 MB.")

    try:
        text = raw.decode("utf-8-sig")   # utf-8-sig strips BOM from Excel exports
    except UnicodeDecodeError:
        text = raw.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="El CSV está vacío o no tiene encabezados.")

    headers = {h.strip().lower() for h in reader.fieldnames}
    missing = _REQUIRED_COLS - headers
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Columnas obligatorias faltantes: {', '.join(sorted(missing))}",
        )

    db = get_supabase()
    inserted = 0
    skipped  = 0
    errors: list[str] = []

    for row_num, raw_row in enumerate(reader, start=2):
        row = {k.strip().lower(): (v or "").strip() for k, v in raw_row.items()}

        first_name = row.get("first_name", "")
        last_name  = row.get("last_name", "")

        if not first_name or not last_name:
            errors.append(f"Fila {row_num}: first_name y last_name son obligatorios.")
            skipped += 1
            continue

        athlete: dict = {
            "first_name": first_name,
            "last_name":  last_name,
            "status":     "active",
            "club_id":    club_id,
        }

        if row.get("email"):
            athlete["email"] = row["email"].lower()

        if row.get("phone"):
            athlete["personal_phone"] = row["phone"]

        if row.get("date_of_birth"):
            try:
                date.fromisoformat(row["date_of_birth"])
                athlete["date_of_birth"] = row["date_of_birth"]
            except ValueError:
                errors.append(
                    f"Fila {row_num}: date_of_birth inválida '{row['date_of_birth']}' "
                    f"(usar YYYY-MM-DD)."
                )

        if row.get("category"):
            cat = row["category"].lower()
            if cat in _VALID_CATEGORIES:
                athlete["category"] = cat
            else:
                errors.append(
                    f"Fila {row_num}: categoría '{cat}' inválida — "
                    f"valores válidos: {', '.join(sorted(_VALID_CATEGORIES))}."
                )

        if row.get("status"):
            st = row["status"].lower()
            if st in _VALID_STATUSES:
                athlete["status"] = st

        _OPT_COL_TO_DB_COL = {
            "gender": "gender",
            "nationality": "nationality",
            "emergency_contact": "emergency_contact_name",
            "emergency_phone": "emergency_contact_phone",
        }
        for opt_col, db_col in _OPT_COL_TO_DB_COL.items():
            if row.get(opt_col):
                athlete[db_col] = row[opt_col]

        try:
            db.table("athletes").insert(athlete).execute()
            inserted += 1
        except Exception as exc:
            msg = str(exc)
            if "duplicate" in msg.lower() or "unique" in msg.lower():
                errors.append(f"Fila {row_num}: atleta duplicado ({first_name} {last_name}).")
                skipped += 1
            else:
                logger.error("CSV import row %d failed: %s", row_num, exc)
                errors.append(f"Fila {row_num}: error al insertar — {msg[:120]}.")
                skipped += 1

    logger.info(
        "CSV import: %d inserted, %d skipped, %d errors",
        inserted, skipped, len(errors),
    )
    return ImportResult(inserted=inserted, skipped=skipped, errors=errors[:50])
