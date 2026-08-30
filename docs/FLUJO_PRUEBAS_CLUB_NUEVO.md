# Flujo de pruebas: alta de un club nuevo hasta cargar datos reales

Guía paso a paso para probar la app de punta a punta con un club de prueba. Complementa `docs/MANUAL_APP.md` (referencia general de la arquitectura).

## ⚠️ Corrección importante antes de empezar

**No hay que "hacer deploy de una carpeta por club".** SpeedSkateTrack Hub es multi-tenant: **un solo despliegue** (el que ya está corriendo en el VPS) sirve a **todos los clubes** al mismo tiempo. Dar de alta un club nuevo es una operación de base de datos (crear la fila en `clubs` + invitar al admin), no una operación de infraestructura — no se toca el servidor, no se corre `deploy.sh`, no se crea ninguna carpeta nueva. El único paso "de deploy" ya pasó (cuando desplegamos la app una vez); a partir de ahí, dar de alta clubes es 100% desde `/superadmin`.

---

## 1. Crear el club (Superadmin)

1. Entrá a `https://track.arkanatech.tech/login` con tu cuenta de Superadmin.
2. Te redirige a `/superadmin` (o andá directo). Botón **"Nuevo club"**.
3. Completá: nombre del club, dominio/subdominio (si no tenés uno real todavía, podés usar algo como `clubprueba.arkanatech.tech` — no hace falta que el DNS resuelva para probar la app por dentro, solo para acceder por ESE dominio específico; podés seguir usando `track.arkanatech.tech` para todo si es más simple), dirección, ciudad, país, teléfonos, y el **plan** (elegí Profesional o Premium si querés probar los agentes IA — Starter no los incluye).
4. Datos del administrador: nombre y correo. Al enviar, se crea el club y se manda un correo de invitación a ese email — **no se genera contraseña temporal**, el admin la define desde el link del correo.
5. El club aparece en la tabla de `/superadmin` con su plan y el switch de "IA" ya prendido o apagado según el plan elegido (podés cambiarlo ahí mismo en cualquier momento, sin recrear el club).

## 2. Primer ingreso del administrador del club

1. El admin recibe el correo de invitación → hace click → define su contraseña.
2. Queda logueado automáticamente y aterriza en `/admin-dashboard` — el club ya está resuelto (no hay que elegir club, es automático por el usuario logueado).

## 3. Configurar el club

`/club-config` (menú "Config. Club" en el sidebar). Pestañas relevantes para el arranque:

- **Club**: nombre, logo, dirección, contacto, presidente/delegado, liga, país, moneda — estos SÍ persisten (arreglado en esta sesión).
- **Sistema**: umbrales operativos (asistencia mínima para competir, esquema de premiación, etc.).
- **Pagos**: días de gracia, recordatorios.
- **Entrenamientos**: máximo de atletas por entrenador, duración por defecto de sesión.
- **Notificaciones**: acá también está la configuración de **Telegram** (Chat ID del club + qué categorías de eventos avisan — pagos, atletas nuevos, seguridad, automatizaciones fallidas). Ver `docs/../memory` o pedime los pasos si querés activarlo para este club también.

## 4. Crear datos reales

Orden sugerido (algunos dependen de que exista el anterior):

1. **Atletas** (`/athletes`, botón "Agregar Atleta"): nombre, fecha de nacimiento (la categoría/nivel se calculan automáticamente al guardar), email, contraseña — cada atleta queda con su propia cuenta de acceso.
2. **Equipamiento** (`/equipamiento`): patines, cascos, etc., asignables a atletas.
3. **Entrenamientos** (`/training`, botón "Nueva Sesión"): fecha, tipo (regular/bicicleta/cortesía), entrenador, ubicación. Desde ahí también se pasa asistencia.
4. **Competencias** (`/competitions`, botón para crear): nombre, fechas, ubicación. Ahí mismo:
   - Se inscriben atletas (**Inscripciones**, lo que alimenta el gráfico de "Delegado").
   - Se cargan **resultados y medallas** por atleta (posición, tiempo, `medal_type`) — esto alimenta el medallero y los KPIs de rendimiento del dashboard de Líder.
5. **Tiempos** (`/tiempos`): registro de marcas/tiempos de entrenamiento fuera de una competencia, para seguimiento de progreso individual.

Con esto cargado, los dashboards de Admin, Líder, Delegado y Atleta (los que corregimos esta sesión) van a mostrar números reales en vez de ceros.

## 5. Activar los agentes de IA según el plan

- Ya construido: si el club está en plan **Starter**, el asistente IA está bloqueado (tanto en el widget flotante como en `/agentes` y los paneles de cada dashboard) — el usuario ve un mensaje claro pidiendo actualizar de plan.
- Si el club está en **Profesional** o **Premium** (o vos activaste el switch de IA manualmente desde `/superadmin` sin importar el plan), los 13 agentes quedan disponibles de inmediato — no hay un paso adicional de "activación" por agente individual, es todo o nada por club.
- **Requisito técnico previo**: el chat de agentes va a fallar con 401 hasta que configures `ANTHROPIC_API_KEY` real en `.env.production` del VPS (sigue en placeholder) — avisame cuando la tengas y la configuro.

## 6. Activar/revisar las automatizaciones

- `/automatizaciones` (rol admin/leader): lista las 37 automatizaciones (`AUTO-01` a `AUTO-37`), cada una con su switch de activado/desactivado por club, y el historial de corridas (éxito/error) de cada una.
- Corren solas por Celery Beat según su horario propio (diario, semanal, etc.) — no hay que "activarlas" manualmente más allá del switch; simplemente empiezan a correr en su próximo horario programado una vez el club tiene datos.
- Para verlas correr más rápido en una prueba, revisá `backend/tasks/schedules.py` para saber la hora exacta de cada una, o pedime que dispare una a mano para probarla al toque.

## 7. Después de esto — revisar cada agente y automatización

Una vez tengas datos reales cargados (paso 4) y el plan con IA activado (paso 5), lo lógico es:
1. Entrar a `/agentes` y probar cada uno de los 13 agentes con una pregunta real sobre los datos que acabás de cargar.
2. Entrar a `/automatizaciones` y revisar el historial de corridas — filtrar por error para ver si alguna falló.
3. Avisame en qué agente/automatización específica querés que me meta primero — con datos reales cargados puedo verificar cada uno end-to-end en vez de solo revisar el código.
