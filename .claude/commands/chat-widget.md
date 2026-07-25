# /chat-widget [agente] — Crear Widget de Chat con Agente IA

Crea el componente de chat flotante que conecta con los agentes LangGraph del backend.

## Uso
```
/chat-widget admin       # Chat con el Agente Admin (AG-01)
/chat-widget coach       # Chat con el Entrenador IA (AG-02)
/chat-widget nutrition   # Chat con la Nutricionista IA (AG-04)
/chat-widget support     # Chat de soporte general (AG-14)
```

## Componentes a crear

### 1. ChatWidget Base — `src/components/agents/ChatWidget.tsx`
Componente reutilizable con:
- Botón flotante (bottom-right) con avatar del agente
- Panel de chat que se expande (slide-up animation)
- Header con nombre del agente, avatar y descripción
- Lista de mensajes con scroll automático
- Input de texto + botón enviar
- Indicador de "escribiendo..." mientras el agente procesa
- Soporte para **streaming** de respuestas (tokens que aparecen progresivamente)
- Historial guardado por sesión en localStorage
- Botón para limpiar conversación
- Modo expandido a pantalla completa (móvil)

### 2. Conexión WebSocket — `src/hooks/useAgentChat.ts`
```typescript
export function useAgentChat(agentType: string) {
  // Conecta al WebSocket del backend: ws://backend/ws/agent/[agentType]
  // Maneja: send(message), onMessage(handler), onStreaming(handler)
  // Auto-reconnect si se pierde la conexión
  // Incluye contexto de usuario (role, athlete_id si aplica)
}
```

### 3. Configuración de Agentes — `src/config/agents.ts`
```typescript
export const AGENTS = {
  admin: {
    name: "Asistente del Club",
    description: "Respondo preguntas sobre atletas, finanzas y operaciones",
    avatar: "🏟️",
    roles: ["admin", "leader"],
    systemHint: "Puedo consultar cualquier dato del club en tiempo real"
  },
  coach: {
    name: "Entrenador IA",
    description: "Experto en patinaje de velocidad y planificación deportiva",
    avatar: "⛸️",
    roles: ["coach", "athlete", "admin"],
    systemHint: "Pregúntame sobre técnica, planes de entrenamiento o análisis de rendimiento"
  },
  nutrition: {
    name: "Nutricionista IA",
    description: "Planes nutricionales personalizados para deportistas",
    avatar: "🥗",
    roles: ["athlete", "coach", "admin"],
    systemHint: "Puedo crear planes nutricionales basados en tu perfil y calendario"
  }
}
```

### 4. Integración en Dashboards
- `AdminDashboard.tsx`: Widget del agente admin (siempre visible)
- `CoachDashboard.tsx`: Widget del agente coach
- `AthleteDashboard.tsx`: Botones para abrir coach IA y nutricionista IA
- Barra de navegación: ícono de chat que abre el agente según el rol

## Diseño del Widget
- Tema: glassmorphism con gradiente del color del agente
- Animación de entrada: slide-up suave
- Mensajes del usuario: burbuja azul/primary a la derecha
- Mensajes del agente: burbuja gris/secondary a la izquierda con avatar
- Markdown renderizado en las respuestas (tablas, listas, negrita)
- Responsive: en móvil ocupa pantalla completa al expandirse

## Persistencia
Guardar historial de conversaciones en tabla `support_tickets`:
```sql
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  agent_type TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
