import type { AgentId } from '@/hooks/useAgentChat';

export interface AgentPreset {
  /** Título visible del panel, incluye el código AG-XX */
  title: string;
  /** Descripción corta de una línea */
  subtitle: string;
  /** Gradiente Tailwind `from-* to-*` para el ícono del panel */
  accentColor: string;
  /** Preguntas sugeridas que se muestran cuando el chat está vacío */
  suggestedQuestions: string[];
}

/**
 * Catálogo central de los 13 agentes IA. Centraliza título, color y preguntas
 * sugeridas para evitar duplicar estos datos en cada dashboard.
 * Los `agentId` coinciden 1:1 con el registry del backend (`api/routes/agents.py`).
 */
export const AGENT_PRESETS: Record<AgentId, AgentPreset> = {
  admin: {
    title: 'Asistente Administrador (AG-01)',
    subtitle: 'Pregunta sobre cualquier dato del club en lenguaje natural',
    accentColor: 'from-orange-500 to-amber-500',
    suggestedQuestions: [
      '¿Cuántos atletas han pagado este mes?',
      '¿Qué atletas llevan más de 3 inasistencias?',
      'Genera un resumen del estado actual del club',
    ],
  },
  skating: {
    title: 'Entrenador IA — Patinaje (AG-02)',
    subtitle: 'Técnica, periodización y estrategia de carrera',
    accentColor: 'from-blue-500 to-indigo-500',
    suggestedQuestions: [
      '¿Qué ejercicios de viraje en pista recomiendas para juvenil?',
      'Crea un plan semanal de entrenamiento de fuerza para pista',
      '¿Cómo periodizar la semana antes de una competencia?',
    ],
  },
  cycling: {
    title: 'Experto en Ciclismo (AG-03)',
    subtitle: 'Entrenamiento cruzado con bicicleta para patinadores',
    accentColor: 'from-cyan-500 to-sky-500',
    suggestedQuestions: [
      'Arma un plan de ciclismo como cross-training',
      '¿Cuántas horas de bici por semana en pretemporada?',
      '¿Qué beneficios aporta el ciclismo al patinaje de velocidad?',
    ],
  },
  nutrition: {
    title: 'Nutricionista IA (AG-04)',
    subtitle: 'Alimentación e hidratación para el rendimiento',
    accentColor: 'from-green-500 to-emerald-500',
    suggestedQuestions: [
      '¿Qué debo comer el día antes de competir?',
      '¿Cómo hidratarme durante un entrenamiento largo?',
      '¿Qué desayuno es ideal para entrenar en la mañana?',
    ],
  },
  gym: {
    title: 'Preparador Físico (AG-05)',
    subtitle: 'Fuerza, pliometría y prevención de lesiones',
    accentColor: 'from-red-500 to-rose-500',
    suggestedQuestions: [
      'Arma una rutina de fuerza para tren inferior',
      'Ejercicios de pliometría para patinadores',
      'Plan de acondicionamiento de pretemporada',
    ],
  },
  medical: {
    title: 'Medicina Deportiva (AG-06)',
    subtitle: 'Lesiones, salud y protocolos de retorno al deporte',
    accentColor: 'from-pink-500 to-rose-500',
    suggestedQuestions: [
      '¿Qué atletas tienen lesiones activas?',
      'Protocolo de retorno al deporte tras un esguince',
      'Recomendaciones para prevenir lesiones de rodilla',
    ],
  },
  finance: {
    title: 'Asesor Financiero (AG-07)',
    subtitle: 'Ingresos, egresos, pagos pendientes y metas del club',
    accentColor: 'from-emerald-500 to-teal-500',
    suggestedQuestions: [
      '¿Cuál es el balance financiero de este mes?',
      '¿Qué atletas tienen pagos pendientes?',
      'Proyecta los ingresos del próximo trimestre',
    ],
  },
  security: {
    title: 'Agente de Seguridad (AG-08)',
    subtitle: 'Auditoría de accesos, permisos, alertas y actividad',
    accentColor: 'from-slate-500 to-gray-600',
    suggestedQuestions: [
      '¿Hay alertas de seguridad recientes?',
      'Muéstrame el resumen de roles de los usuarios',
      '¿Qué automatizaciones fallaron en las últimas 24h?',
    ],
  },
  marketing: {
    title: 'Marketing y Comunicación (AG-09)',
    subtitle: 'Contenido para redes, comunicados y crecimiento',
    accentColor: 'from-fuchsia-500 to-pink-500',
    suggestedQuestions: [
      'Redacta un post de Instagram para el próximo torneo',
      'Dame ideas para captar nuevos atletas',
      'Escribe un comunicado con los resultados de la última competencia',
    ],
  },
  results: {
    title: 'Analista de Resultados (AG-10)',
    subtitle: 'Rankings, historial y análisis de rendimiento',
    accentColor: 'from-amber-500 to-yellow-500',
    suggestedQuestions: [
      '¿Cuáles fueron los mejores resultados del mes?',
      'Muéstrame el ranking actual del club',
      'Analiza el rendimiento reciente de un atleta',
    ],
  },
  operations: {
    title: 'Agente de Operaciones (AG-11)',
    subtitle: 'Sesiones, equipamiento, capacidad y resumen del día',
    accentColor: 'from-teal-500 to-cyan-500',
    suggestedQuestions: [
      '¿Cómo van las sesiones de entrenamiento de hoy?',
      '¿Cuál es el estado del equipamiento del club?',
      'Analiza la capacidad de las sesiones de esta semana',
    ],
  },
  legal: {
    title: 'Agente Legal y Cumplimiento (AG-12)',
    subtitle: 'Consentimientos, seguros, documentos y normativa FCP',
    accentColor: 'from-indigo-500 to-blue-600',
    suggestedQuestions: [
      '¿Qué consentimientos parentales faltan por firmar?',
      '¿Qué documentos legales están por vencer?',
      'Dame el checklist de cumplimiento normativo FCP',
    ],
  },
  psychology: {
    title: 'Psicología Deportiva (AG-13)',
    subtitle: 'Motivación, concentración y bienestar mental',
    accentColor: 'from-violet-500 to-purple-500',
    suggestedQuestions: [
      '¿Cómo manejar los nervios antes de una carrera?',
      'Técnicas de visualización para competir mejor',
      '¿Cómo recuperar la motivación de un atleta?',
    ],
  },
};
