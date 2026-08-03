"""AG-06 — Agente de Medicina Deportiva para patinadores de velocidad."""

import json
from datetime import datetime

from langchain_core.messages import SystemMessage
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from agents.base_agent import BaseAgent, current_user_role
from database.supabase_client import get_supabase

_AUTHORIZED_ROLES = {"admin", "coach", "leader"}


@tool
def get_athlete_health_profile(athlete_id: str) -> str:
    """Obtiene el perfil de salud básico de un atleta: datos generales, lesiones conocidas y contacto de emergencia."""
    if current_user_role.get() not in _AUTHORIZED_ROLES:
        return json.dumps({"error": "Acceso no autorizado al perfil de salud del atleta"}, ensure_ascii=False)
    client = get_supabase()
    result = (
        client.table("athletes")
        .select(
            "first_name, last_name, category, birth_date, gender, weight_kg, height_cm, "
            "blood_type, allergies, chronic_conditions, emergency_contact_name, emergency_contact_phone"
        )
        .eq("id", athlete_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return json.dumps({"error": "Atleta no encontrado"}, ensure_ascii=False)
    a = result.data[0]
    age = None
    if a.get("birth_date"):
        born = datetime.fromisoformat(a["birth_date"])
        age = (datetime.now() - born).days // 365
    return json.dumps({
        "nombre": f"{a.get('first_name','')} {a.get('last_name','')}".strip(),
        "categoria": a.get("category"),
        "edad": age,
        "genero": a.get("gender"),
        "peso_kg": a.get("weight_kg"),
        "talla_cm": a.get("height_cm"),
        "grupo_sanguineo": a.get("blood_type"),
        "alergias": a.get("allergies"),
        "condiciones_cronicas": a.get("chronic_conditions"),
        "contacto_emergencia": a.get("emergency_contact_name"),
        "tel_emergencia": a.get("emergency_contact_phone"),
    }, ensure_ascii=False)


@tool
def get_athletes_requiring_medical_attention() -> str:
    """Lista atletas activos con condiciones médicas registradas o alergias conocidas."""
    client = get_supabase()
    result = (
        client.table("athletes")
        .select("id, first_name, last_name, category, allergies, chronic_conditions, blood_type")
        .eq("status", "active")
        .or_("chronic_conditions.not.is.null,allergies.not.is.null")
        .limit(50)
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False)


@tool
def get_equipment_status() -> str:
    """Revisa el estado del equipamiento médico y de primeros auxilios del club (botiquín)."""
    client = get_supabase()
    result = (
        client.table("equipment")
        .select("name, equipment_type, status, condition_notes, next_maintenance_at")
        .execute()
    )
    return json.dumps(result.data or [], ensure_ascii=False, default=str)


_SYSTEM_PROMPT = """Eres el Asesor de Medicina Deportiva del club de patinaje. Brindas orientación \
sobre salud deportiva, prevención de lesiones, primeros auxilios y protocolos de retorno al entrenamiento.

⚠️ AVISO LEGAL IMPORTANTE:
Este agente es un ASISTENTE INFORMATIVO. NO reemplaza la evaluación de un médico deportólogo licenciado. \
Ante cualquier lesión, síntoma agudo o duda clínica, siempre remite al médico del club o a urgencias.

ÁREAS DE ORIENTACIÓN:
- Lesiones comunes en patinaje: rodilla (tendinopatía rotuliana, LCA), tobillo, cadera, espalda lumbar, hombro
- Protocolo PRICE/POLICE para lesiones agudas (Protección, Reposo, Hielo, Compresión, Elevación)
- Criterios de retorno gradual al entrenamiento (Return to Sport)
- Prevención: calentamiento, enfriamiento, flexibilidad, fortalecimiento preventivo
- Hidratación y termorregulación en entrenamiento
- Primeros auxilios básicos: golpes, caídas, traumatismos, síncope
- Chequeos médicos recomendados para deportistas
- Antidoping: sustancias prohibidas en la lista WADA/FCP

CONTEXTO DEL DEPORTE:
El patinaje de velocidad genera alta carga en articulaciones de rodilla y cadera (flexión mantenida), \
impacto en caídas, y riesgo de lesión por sobreuso. Las lesiones más frecuentes son:
- Rodilla: Síndrome Patelofemoral, tendinopatía del cuádriceps
- Tobillo: esguinces, problemas por calzado ajustado
- Cadera: impingement, bursitis trocantérea
- Espalda: contractura lumbar por postura de patinaje

PROTOCOLOS DEL CLUB:
- Toda lesión moderada-grave debe registrarse y comunicarse al entrenador y al padre/tutor si es menor
- Antes de regresar de una lesión: evaluación médica obligatoria y autorización por escrito
- Antecedentes médicos de atletas son confidenciales: solo acceso autorizado

HERRAMIENTAS:
- Puedes consultar perfiles de salud de atletas si se proporciona el ID
- Puedes ver atletas con condiciones médicas registradas

REGLAS:
- Responde en el idioma del usuario
- Nunca diagnostiques ni prescribas medicamentos
- Para menores, cualquier decisión médica requiere consentimiento de padres
- Ante emergencia (pérdida de consciencia, fractura, dolor torácico): 112 / Urgencias primero
"""


class MedicalAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__()
        self._graph = create_react_agent(
            self.llm,
            tools=[
                get_athlete_health_profile,
                get_athletes_requiring_medical_attention,
                get_equipment_status,
            ],
            state_modifier=SystemMessage(content=_SYSTEM_PROMPT),
        )

    @property
    def agent_id(self) -> str:
        return "medical"

    @property
    def system_prompt(self) -> str:
        return _SYSTEM_PROMPT

    async def chat(self, message: str, history: list[dict]) -> str:
        result = await self._graph.ainvoke({"messages": self._build_history(message, history)})
        last = result["messages"][-1]
        return last.content if hasattr(last, "content") else str(last)
