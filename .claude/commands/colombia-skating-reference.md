# /colombia-skating-reference — Base de Conocimiento Patinaje de Velocidad Colombiano

Referencia técnica completa del sistema de patinaje de velocidad en Colombia según la Federación Colombiana de Patinaje (FCP), la Liga de Patinaje de Bogotá, y el reglamento World Skate.

> Usar este skill cuando se necesite información sobre categorías colombianas, lógica de corte de edad, calendario de competencias, tiempos de referencia, tipos de prueba, o reglamento específico de Colombia.

---

## Sistema de Categorías Colombia (FCP) — CORTE 1 DE JULIO

### Regla de corte de edad FCP
La edad del deportista se calcula **a 1 de julio del año de competencia**:
- Si cumpleaños es **ANTES del 1 de julio**: edad = año_competencia − año_nacimiento
- Si cumpleaños es **EL 1 de julio**: entra a la categoría MAYOR (inclusive)
- Si cumpleaños es **DESPUÉS del 1 de julio**: edad = año_competencia − año_nacimiento − 1

**Ejemplo para competencia 2026:**
- Nacido 15/03/2008 → en julio 1 tiene 18 años → **MAYORES**
- Nacido 01/07/2008 → exactamente 18 años en julio 1 → **MAYORES** (julio 1 inclusive = mayor)
- Nacido 05/08/2008 → en julio 1 solo tiene 17 años → **JUVENIL 3er AÑO**
- Nacido 05/08/2012 → en julio 1 de 2025 tiene 12 años → **INFANTIL 12 AÑOS**

### Regla World Skate (para eventos internacionales)
Corte **31 de diciembre del año de competencia**. Edad = año_competencia − año_nacimiento independientemente del mes.

### Tabla completa de categorías FCP
| Categoría | Edad a julio 1 | Notas |
|-----------|----------------|-------|
| Mini 7 años | 7 | Ruedas hasta 80mm |
| Mini 8 años | 8 | Ruedas hasta 80mm |
| Mini 9 años | 9 | Ruedas hasta 84mm |
| Mini 10 años | 10 | Ruedas hasta 84mm |
| Pre-infantil 11 años | 11 | Ruedas hasta 90mm |
| Infantil 12 años | 12 | Ruedas hasta 100mm |
| Junior 13 años | 13 | Ruedas hasta 100mm |
| Prejuvenil 14 años | 14 | Sin restricción de rueda |
| Juvenil 1er año | 15 | Sin restricción de rueda |
| Juvenil 2do año | 16 | Sin restricción de rueda |
| Juvenil 3er año | 17 | Sin restricción de rueda |
| Mayores | 18 en adelante | Incluye desde 18 hasta 34 |
| Masters | 35 en adelante | Subcategorías 35-39, 40-44, 45-49, 50+ |

### Configuración de club — selector de corte
El sistema permite configurar cuál corte usar:
- **FCP / Liga Bogotá**: 1 de julio
- **World Skate**: 31 de diciembre
La configuración afecta el cálculo automático de categoría en toda la app.

---

## Algoritmo de cálculo de categoría

```typescript
function calcularEdadDeportiva(fechaNacimiento: Date, añoCompetencia: number, 
                                corte: 'fcp' | 'worldskate'): number {
  if (corte === 'worldskate') {
    return añoCompetencia - fechaNacimiento.getFullYear();
  }
  // FCP: corte 1 de julio
  const julio1 = new Date(añoCompetencia, 6, 1); // mes 6 = julio
  const edad = añoCompetencia - fechaNacimiento.getFullYear();
  // Si cumpleaños es después del 1 de julio (no ha cumplido aún)
  const mesNac = fechaNacimiento.getMonth();  // 0=enero
  const diaNac = fechaNacimiento.getDate();
  const cumplioDespuesJulio = mesNac > 6 || (mesNac === 6 && diaNac > 1);
  return cumplioDespuesJulio ? edad - 1 : edad;
}

function obtenerCategoria(edadDeportiva: number): string {
  if (edadDeportiva <= 7) return 'Mini 7 años';
  if (edadDeportiva === 8) return 'Mini 8 años';
  if (edadDeportiva === 9) return 'Mini 9 años';
  if (edadDeportiva === 10) return 'Mini 10 años';
  if (edadDeportiva === 11) return 'Pre-infantil 11 años';
  if (edadDeportiva === 12) return 'Infantil 12 años';
  if (edadDeportiva === 13) return 'Junior 13 años';
  if (edadDeportiva === 14) return 'Prejuvenil 14 años';
  if (edadDeportiva === 15) return 'Juvenil 1er año';
  if (edadDeportiva === 16) return 'Juvenil 2do año';
  if (edadDeportiva === 17) return 'Juvenil 3er año';
  if (edadDeportiva >= 18 && edadDeportiva < 35) return 'Mayores';
  if (edadDeportiva >= 35) return 'Masters';
  return 'Menores'; // fallback
}
```

---

## Tipos de Prueba — Pista de Velocidad (Carreras)

### Pruebas de pista (velódromo / pista de 200m)
| Código | Nombre | Descripción | Formato resultado |
|--------|--------|-------------|-------------------|
| CARRILES | Carriles (sprint) | Salida individual por carril, contra el cronómetro | Tiempo decimal (s.mmm) |
| REMATES | Remates con distancia | Arranque en masa, 200m+D | Posición de llegada |
| ELIM | Eliminación | Se elimina el último cada vuelta o conjunto de vueltas | Posición de llegada |
| REL-EMP | Relevos con empuje | Equipo de 2-5 patinadores, relevo con empuje físico | Posición de llegada |
| PUNTOS | Puntos | Carrera larga, se suman puntos en sprints intermedios | Puntos acumulados |
| LINEA | En línea | Carrera de fondo sin eliminación | Posición de llegada |
| REACT | Reacción en carriles | Sprint de 30m con salida al silbato | Tiempo decimal (s.mmm) |
| 500+D | 500m con distancia | Sprint de 500m con salida lanzada | Tiempo decimal (s.mmm) |

### Distancias por categoría (Campeonato Distrital Bogotá)
| Categoría | Prueba 1 | Prueba 2 | Prueba 3 | Prueba 4 | Prueba 5 |
|-----------|----------|----------|----------|----------|----------|
| Mini 7-8 | Remates 200m+D | Elim 2000m | Relevos 600m | Reacción 30m | En línea 1200m |
| Mini 9-10 | Remates 200m+D | Elim 3000m | Relevos 600m | Reacción 30m | En línea 1600-2000m |
| Preinfantil 11 | Remates 200m+D | Elim 6000m | Relevos 1200m | Carriles 100m | Puntos 6000m |
| Infantil 12 | Remates 200m+D | Elim 8000m | Relevos 1200m | Carriles 100m | Puntos 8000m |
| Junior 13 | Remates 200m+D | Elim 10000m | Relevos 1200m | Carriles 100m | Puntos 10000m |
| Prejuvenil/Mayores | Carriles | 500+D | 4000m mixto | Eliminación | Fondo |

---

## Tipos de Prueba — Circuito de Habilidad

### Reglas generales de circuito
- Desplazar o tumbar un cono = **1 falta = +0.20 segundos** al tiempo final
- 3 o más faltas = **ELIMINACIÓN**
- Saltar un cono = **ELIMINACIÓN** (no realizó el circuito)
- Entrada obligatoria (dos conos juntos) = obligatorio pasar por ahí, si no = **ELIMINACIÓN**

### Circuitos del Banco de Pruebas FEDEPATIN
| Circuito | Dimensiones | Descripción del recorrido |
|----------|-------------|---------------------------|
| **AMEBA** | 11m x 8m | Salida libre → cono interno → gira izquierda → segundo cono interno → remata girando izquierda |
| **ANTIFAZ** | 20.5m largo | Sale con silbato → segundo semicírculo → media vuelta → entra por un lado de serie de conos → otra media vuelta → entra por otra serie → remata |
| **ESTRELLA** | 9m x 10m (aprox) | Circuito en forma de estrella con 5 puntas, recorrido específico por pasillos |

---

## Planilla de Inscripción — Distritales Ligados Bogotá

### Encabezado
| Campo | Descripción |
|-------|-------------|
| Evento | Nombre del evento |
| Fecha | Fecha del evento |
| Club | Nombre del club |
| Liga | Liga de Patinaje de Bogotá |
| Presidente | Nombre del presidente del club |
| Número Id. Presid. | Cédula del presidente |
| Delegado | Nombre del delegado acreditado |
| Teléfono Del. | Celular del delegado |
| Entrenador | Nombre del entrenador acreditado |
| Teléfono Ent. | Celular del entrenador |

### Tarifas 2026
| Concepto | Ordinaria | Extraordinaria |
|----------|-----------|----------------|
| Por deportista | $79.200 | $100.200 |
| Por club | $161.000 | $188.000 |

### Fórmula valor a pagar
`Valor a Pagar = Valor Club + (Cant. Deportistas × Valor por Deportista)`

### Columnas por deportista
| # | Campo | Descripción |
|---|-------|-------------|
| 1 | Cont | Consecutivo (1, 2, 3...) |
| 2 | # Comp | Número de competidor (asignado por la liga) |
| 3 | Nombres | Nombres del deportista |
| 4 | Apellidos | Apellidos del deportista |
| 5 | Rama | Damas / Varones |
| 6 | Día | Día de nacimiento |
| 7 | Mes | Mes de nacimiento |
| 8 | Año | Año de nacimiento |
| 9 | Categoría | Categoría calculada automáticamente según corte de julio 1 |
| 10 | Tipo Registro | Ligado / No ligado / Nuevo |
| 11 | Tipo Doc | CC, TI, Pasaporte, etc. |
| 12 | Num Doc | Número del documento |
| 13 | P1 | Prueba 1 (X si participa) |
| 14 | P2 | Prueba 2 (X si participa) |
| 15 | P3 | Prueba 3 (X si participa) |
| 16 | P4 | Prueba 4 (X si participa) |
| 17 | P5 | Prueba 5 (X si participa) |

---

## Estructura de Resultados Oficiales (formato Colombia)

### Planilla de siembra / seeding (antes del evento)
```
# COMP | NOMBRES | APELLIDOS | RAMA | CATEGORÍA | CLUB | P1 | SERIE | SORTEO
```

### Planilla de resultados finales
```
POSC | NÚM | FINAL | SEMIFINAL | TIEMPO | OE/OBS | NOMBRE | APELLIDO | CATEGORÍA | RAMA | CLUB
```
- **POSC**: Posición final
- **NÚM**: Número de peto/bib
- **FINAL**: Tiempo en la final (segundos decimales, ej: 10.866)
- **SEMIFINAL**: Tiempo en semifinal (si aplica)
- **TIEMPO**: Tiempo en series/clasificación
- **OBS**: FS (falsa salida), DNS (no salió), DNF (no terminó), DQ (descalificado)

### Observaciones especiales (OBS)
| Código | Significado |
|--------|-------------|
| FS | False Start — Salida falsa |
| DNS | Did Not Start — No tomó partida |
| DNF | Did Not Finish — No terminó |
| DQ | Disqualified — Descalificado |
| EL | Eliminated — Eliminado en carrera |
| W | Withdrawn — Retirado voluntariamente |

---

## Tiempos de Referencia por Categoría

### Mini y Transición (nivel Bogotá)
| Categoría | Masculino 200m | Femenino 200m | Masculino 100m | Femenino 100m |
|-----------|----------------|----------------|----------------|----------------|
| Mini 7 | 22-28 seg | 24-30 seg | 12-16 seg | 13-17 seg |
| Mini 8 | 20-25 seg | 22-27 seg | 11-14 seg | 12-15 seg |
| Mini 9 | 18-23 seg | 20-25 seg | 10-13 seg | 11-14 seg |
| Mini 10 | 17-21 seg | 18-23 seg | 9-12 seg | 10-13 seg |
| Pre-infantil 11 | 15-19 seg | 16-20 seg | 8-11 seg | 9-12 seg |
| Infantil 12 | 14-18 seg | 15-19 seg | 8-10 seg | 9-11 seg |
| Junior 13 | 13-17 seg | 14-18 seg | 7-9 seg | 8-10 seg |

### Prejuvenil y Mayores (nivel Bogotá/Nacional)
| Categoría | Masculino 300m | Femenino 300m | Masculino 500m | Femenino 500m |
|-----------|----------------|----------------|----------------|----------------|
| Prejuvenil 14 | 27-30 seg | 29-33 seg | 46-52 seg | 50-57 seg |
| Juvenil 1er año (15) | 26.5-29.5 seg | 28-31.5 seg | 44-50 seg | 48-54 seg |
| Juvenil 2do año (16) | 26-29 seg | 27.5-31 seg | 43-48 seg | 47-53 seg |
| Juvenil 3er año (17) | 25.5-28.5 seg | 27-30.5 seg | 42-47 seg | 46-52 seg |
| Mayores (18+) | 24.5-27 seg | 26.5-29.5 seg | 42-47 seg | 45-51 seg |
| Masters (35+) | 26-30 seg | 28-33 seg | 46-52 seg | 50-58 seg |

### Tiempos de carril (Campeonato Distrital Avalatorio julio 2026 — referencia real)
| Categoría | Rama | Mejor tiempo observado | Tiempo promedio top 10 |
|-----------|------|------------------------|------------------------|
| Prejuvenil | Varones | 10.539 seg | 11.5-12.5 seg |
| Mayores | Damas | 10.866 seg | 11.5-13 seg |
| Mayores | Varones | ~10-11 seg | 10.5-12 seg |

---

## Calendario Competitivo Bogotá (Liga de Patinaje)

### Tipos de eventos por nivel
| Nivel | Nombre | Participantes | Inscripción (2026) |
|-------|--------|---------------|---------------------|
| Distrital | Campeonato Distrital Avalatorio | Todos los clubes ligados a la Liga Bogotá | $79.200/deportista |
| Distrital | Maratón Distrital | Ligados + no ligados semipro | $79.200/deportista |
| Nacional | Copa Colombia | Ligas departamentales | Según FCP |
| Nacional | Campeonato Nacional | Selecciones departamentales | Según FCP |
| Nacional | Válida Nacional | Clasificación para selección Colombia | Según FCP |
| Internacional | Panamericano | Selección Colombia + países invitados | FCP/World Skate |

### Requisitos de inscripción (Bogotá)
1. Carné vigente Liga de Patinaje de Bogotá para el año en curso
2. Renovación registrada en la plataforma VELOPRO (para eventos FCP)
3. Consignación o transferencia vía QR oficial
4. Planilla diligenciada correctamente con todos los campos
5. EPS vigente (póliza de accidentes)

---

## ¿Por qué Cali es la capital mundial del patinaje?
- Clima estable (1000m altitud, temperatura 22-26°C todo el año)
- Infraestructura: Pista La Nubia, estadios cubiertos
- Tradición generacional: familias completas de patinadores
- Colombia ha dominado el Campeonato Mundial de Patinaje de Velocidad por décadas
- El Valle del Cauca aporta ~60% de la selección Colombia
- Eventos mundiales en Cali: World Inline Cup, Copa del Mundo, World Skate Games

---

## Diámetros de rueda por categoría (Liga Bogotá)
| Edad | Diámetro máximo |
|------|----------------|
| Mini 7-8 años | Hasta 80mm |
| Mini 9-10 años | Hasta 84mm |
| Pre-infantil 11 años | Hasta 90mm |
| Infantil 12 años | Hasta 100mm |
| Junior 13 años | Hasta 100mm |
| Prejuvenil 14+ | Sin restricción |

---

## Premios por categoría (Resolución 061 Bogotá 2026)
| Categoría | Número de premiados | Tipo de premio |
|-----------|---------------------|----------------|
| Mini 7 años | 10 primeros | Reconocimientos iguales (destacado) |
| Mini 8-10 años | 7 primeros | Reconocimientos iguales (destacado) |
| Pre-infantil 11 años | 5 primeros | Reconocimientos iguales (destacado) |
| Infantil 12 años | 5 primeros | Oro (1°), Plata (2°-3°), Bronce (4°-5°) |
| Junior 13 años | 5 primeros | Oro (1°), Plata (2°-3°), Bronce (4°-5°) |
| Prejuvenil+ | 3 primeros | Oro, Plata, Bronce clásico |
| Maratón abierta | 10 primeros | Medalla + bonos en efectivo ($1M primer lugar) |
