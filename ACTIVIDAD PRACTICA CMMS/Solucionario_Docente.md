# Solucionario / Guía del Docente — Actividad de Fichas Técnicas
### MaintPro CMMS · TOSEM · UNIPAZ

---

## Cómo correr la sesión (3 horas)
| Tramo | Actividad |
|---|---|
| 0:00–0:20 | Demo en vivo: registra usted la Bomba (BOM-001) + 1 plan + muestra el calendario y el PDF. |
| 0:20–1:10 | Estudiantes registran los 3 equipos + 2 técnicos. |
| 1:10–2:10 | Estudiantes crean los planes preventivos (incluido el de medidor). |
| 2:10–2:40 | Distribuyen fechas, revisan el Calendario y descargan los PDF. |
| 2:40–3:00 | Cierre: revisa el panel docente en tiempo real y comenta resultados. |

> Antes de iniciar: confirme que cada estudiante entra con su cédula y que ve su empresa/planta en el panel docente.

---

## Puntos clave a verificar (rápido, desde el panel docente)
- **Total Activos = 3** por estudiante.
- **Cumplimiento PM** sube a medida que crean planes.
- **PM Vencidos** debe quedar en 0 si pusieron fechas futuras.
- En *Activos* deben verse las 3 categorías y la criticidad correcta (2 Alta, 1 Media).

---

## Configuración esperada (clave de respuestas)

### Activos (campos críticos)
| Equipo | Código | Categoría | Criticidad |
|---|---|---|---|
| Bomba Centrífuga Horizontal | BOM-001 | Bombas | Alta |
| Motor Eléctrico de Inducción | MOT-001 | Motores Eléctricos | Media |
| Compresor de Aire de Tornillo | COM-001 | Compresores | Alta |

### Planes preventivos esperados
| Equipo | Plan | Frecuencia | Trigger | Técnico |
|---|---|---|---|---|
| BOM-001 | Inspección semanal | 7 días | Tiempo | Mecánico |
| BOM-001 | Mantenimiento trimestral | 90 días | Tiempo | Mecánico |
| MOT-001 | Inspección termográfica mensual | 30 días | Tiempo | Electricista |
| MOT-001 | Medición de aislamiento (opcional) | 90 días | Tiempo | Electricista |
| COM-001 | Inspección semanal | 7 días | Tiempo | Mecánico |
| COM-001 | Cambio filtros y aceite | 2000 (medidor: horas) | Medidor | Mecánico |

### Errores comunes a buscar
- Poner el compresor con trigger por Tiempo en vez de Medidor (resta puntos del criterio del medidor).
- Frecuencia en unidad equivocada (ej. 7 en "horas" en vez de "días").
- No asignar técnico o asignar el de especialidad incorrecta (electricista a tareas mecánicas).
- Dejar la Próxima Ejecución vacía: no aparece en el calendario.
- Criticidad por defecto "Alta" en el motor (debería ser Media).

---

## Variantes (para evitar copia)
- Pedir que cambien la marca/modelo por equipos reales que ellos investiguen.
- Asignar criticidades distintas por grupo y que justifiquen con una matriz de criticidad (consecuencia × frecuencia).
- Inyectarles una avería (botón del panel docente) a mitad de sesión para que además gestionen la OT correctiva con RCA.

---

## Inyección de avería (extensión opcional, +30 min)
1. Desde el panel docente, en la fila del estudiante, use el botón de inyección y elija un equipo y prioridad crítica.
2. El estudiante recibe la alerta, debe ir a Órdenes de Trabajo, crear la OT correctiva, hacer el RCA (5 porqués) y cerrarla.
3. Verifique en tiempo real cómo cambian su disponibilidad y costo.

---
*MaintPro CMMS · UNIPAZ — TOSEM 2026*
