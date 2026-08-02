# Smoke Tests Post-Deploy — SpeedSkateTrack Hub

Ejecutar manualmente después de cada deploy a producción.
Marcar cada ítem con ✅ o ❌ + nota.

---

## 1. Autenticación

- [ ] `/login` carga sin errores de consola
- [ ] Login con credencial admin exitoso → redirecciona a `/admin-dashboard`
- [ ] Login con credencial coach → redirecciona a `/coach-dashboard`
- [ ] Login con credencial parent → redirecciona a `/parent-dashboard`
- [ ] Login con credencial incorrecta → muestra error (no 500)
- [ ] Logout limpia la sesión y redirecciona a `/login`
- [ ] Ruta protegida sin sesión `/admin-dashboard` → redirecciona a `/login`

## 2. Admin Dashboard

- [ ] Cards de estadísticas cargan (atletas, asistencia, finanzas)
- [ ] Panel del agente IA admin es visible
- [ ] No hay errores en consola del navegador

## 3. Gestión de Atletas

- [ ] `/athletes` carga lista de atletas
- [ ] Buscador filtra resultados en tiempo real
- [ ] Botón médico abre diálogo con 5 tabs
- [ ] Tab Vacunas muestra registros o estado vacío
- [ ] Tab Tests Físicos carga sin error

## 4. Entrenamientos

- [ ] `/training` carga calendario del mes actual
- [ ] Botones Mes/Semana/Día cambian la vista
- [ ] Botón "Exportar .ics" descarga archivo `.ics`
- [ ] Filtro por tipo de entrenamiento funciona

## 5. Módulo Médico

- [ ] Abrir diálogo médico → 5 tabs visibles
- [ ] Tab Vacunas: botón "+" abre formulario inline
- [ ] Tab Tests Físicos: muestra grupos de métricas
- [ ] Cerrar diálogo sin errores

## 6. Documentos y Firma Digital

- [ ] `/documents` carga con 4 tabs
- [ ] Tab Firma Digital muestra 5 documentos firmables
- [ ] Botón "Firmar" → dialog con canvas visible
- [ ] Canvas acepta dibujo con mouse
- [ ] Botón "Borrar" limpia el canvas

## 7. Mensajería

- [ ] `/mensajes` carga bandeja de entrada
- [ ] Badge de mensajes no leídos actualiza en tiempo real (Realtime)
- [ ] Abrir hilo de mensajes funciona

## 8. Portal de Padres

- [ ] `/parent-dashboard` muestra datos del atleta hijo
- [ ] Card "Estado médico" visible (con o sin restricciones)
- [ ] Link a mensajes funciona
- [ ] Parent NO puede acceder a `/admin-dashboard`

## 9. Competencias

- [ ] `/competitions` carga lista de competencias
- [ ] Ranking/resultados son visibles

## 10. Configuración y Seguridad

- [ ] Supabase Logs → 0 errores PGRST301 (RLS blocked) en flujos normales
- [ ] Network tab: ninguna request falla con 401/403 en flujos de usuario válido
- [ ] `athlete_cv_summary` no expone datos de otros atletas (test manual con usuario athlete)

---

**Fecha de última verificación:** ___________  
**Verificado por:** ___________  
**Build/commit:** ___________  
**Resultado:** ✅ PASS / ❌ FAIL
