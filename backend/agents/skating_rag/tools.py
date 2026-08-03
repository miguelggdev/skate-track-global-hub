from datetime import date
from langchain_core.tools import tool


@tool
def calculate_athlete_category(birth_date_str: str) -> str:
    """
    Calcula la categoría FCP de un atleta a partir de su fecha de nacimiento (YYYY-MM-DD).
    La FCP usa la edad que el atleta cumple el 1 de julio del año de competencia.
    """
    try:
        birth = date.fromisoformat(birth_date_str)
    except ValueError:
        return "Formato de fecha inválido. Usa YYYY-MM-DD (ej: 2010-03-15)."

    today = date.today()
    july1 = date(today.year, 7, 1)
    age = july1.year - birth.year - ((july1.month, july1.day) < (birth.month, birth.day))

    if age <= 7:
        cat = "Mini (7 años o menos)"
        wheel = "80mm"
    elif age == 8:
        cat = "Preinfantil 8"
        wheel = "80mm"
    elif age <= 10:
        cat = f"Infantil A ({age} años)"
        wheel = "84mm"
    elif age <= 12:
        cat = f"Infantil B ({age} años)"
        wheel = "90mm"
    elif age <= 14:
        cat = f"Prejuvenil ({age} años)"
        wheel = "100mm"
    elif age <= 16:
        cat = f"Juvenil ({age} años)"
        wheel = "110mm"
    elif age <= 18:
        cat = f"Junior ({age} años)"
        wheel = "110mm (sin restricción en pista)"
    elif age < 35:
        cat = f"Senior ({age} años)"
        wheel = "Sin restricción"
    else:
        cat = f"Master ({age} años)"
        wheel = "Sin restricción"

    return (
        f"Categoría: {cat}\n"
        f"Edad al 01/07/{today.year}: {age} años\n"
        f"Rueda máxima permitida: {wheel}"
    )


@tool
def get_max_wheel_size(category: str) -> str:
    """
    Retorna el tamaño máximo de rueda permitido para una categoría FCP.
    Categorías válidas: Mini, Preinfantil, Infantil A, Infantil B, Prejuvenil, Juvenil, Junior, Senior, Master.
    """
    limits = {
        "mini": "80mm",
        "preinfantil": "80mm",
        "infantil a": "84mm",
        "infantil b": "90mm",
        "prejuvenil": "100mm",
        "juvenil": "110mm",
        "junior": "110mm (sin restricción en pista de competencia)",
        "senior": "Sin restricción",
        "master": "Sin restricción",
    }
    key = category.lower().strip()
    for cat_key, limit in limits.items():
        if cat_key in key:
            return f"{category}: máximo {limit}"
    return (
        f"No reconozco la categoría '{category}'. "
        f"Categorías válidas: {', '.join(c.title() for c in limits)}"
    )
