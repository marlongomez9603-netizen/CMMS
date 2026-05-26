# Actividad Práctica — Implementación de un Plan de Mantenimiento en el CMMS
### TOSEM · UNIPAZ · MaintPro CMMS

---

## 🎯 Objetivo
Registrar **3 equipos** en el sistema CMMS a partir de sus fichas técnicas y construir su **plan de mantenimiento preventivo del año**, aplicando taxonomía de activos (ISO 14224), criticidad, frecuencias y recursos.

## ⏱️ Duración
3 horas (sesión guiada).

## ✅ Lo que debes entregar
1. Los **3 equipos** registrados en el sistema (con todos sus campos).
2. Al menos **2 técnicos** registrados en *Personal Técnico*.
3. Los **planes de mantenimiento preventivo** de cada equipo (mínimo los indicados).
4. El **PDF del Calendario Anual** de cada equipo (botón 📅 en *Activos* o en la ficha del equipo).
5. El **PDF del plan semanal** de uno de tus técnicos (vista Técnico → Calendario Semanal).

> 💡 El docente verá tu avance **en tiempo real** desde el panel docente.

---

## 🧭 Pasos
1. **Ingresa** al sistema con tu número de cédula.
2. Ve a **Activos / Equipos → Nuevo Activo** y registra los 3 equipos (fichas abajo).
3. Ve a **Personal Técnico → Nuevo** y registra los 2 técnicos.
4. Ve a **Mtto. Preventivo → Nuevo Plan** y crea los planes de cada equipo.
5. Revisa el **Calendario** para ver tus actividades programadas del año.
6. Descarga el **Calendario Anual** de cada equipo y el **Plan Semanal** del técnico.

---

# 📋 FICHAS TÉCNICAS
> Cada campo corresponde **exactamente** a un campo del formulario *Nuevo Activo*. La *Ubicación* la defines según tu planta (ej. "Zona de Bombeo", "Sala Eléctrica").

## Ficha 1 — Bomba Centrífuga Horizontal
| Campo del sistema | Valor |
|---|---|
| **Nombre** | Bomba Centrífuga Horizontal |
| **Código** | BOM-001 |
| **Categoría** | Bombas |
| **Ubicación** | (definir — ej. Zona de Bombeo) |
| **Marca** | Sulzer |
| **Modelo** | CPT 32-200 |
| **Serial** | SLZ-2021-04477 |
| **Fecha Instalación** | 2021-03-15 |
| **Vencimiento Garantía** | 2024-03-15 |
| **Criticidad** | Alta |
| **Especificaciones Técnicas** | Caudal: 120 m³/h · Altura: 45 m · Potencia: 30 kW · 3500 RPM · Sello mecánico · Impulsor acero inox 316 |

## Ficha 2 — Motor Eléctrico de Inducción
| Campo del sistema | Valor |
|---|---|
| **Nombre** | Motor Eléctrico de Inducción |
| **Código** | MOT-001 |
| **Categoría** | Motores Eléctricos |
| **Ubicación** | (definir — ej. Sala Eléctrica) |
| **Marca** | WEG |
| **Modelo** | W22 200L |
| **Serial** | WEG-2020-11923 |
| **Fecha Instalación** | 2020-06-10 |
| **Vencimiento Garantía** | 2023-06-10 |
| **Criticidad** | Media |
| **Especificaciones Técnicas** | 75 HP · 460 V / 60 Hz · 1780 RPM · IP55 · Eficiencia IE3 · Arranque suave |

## Ficha 3 — Compresor de Aire de Tornillo
| Campo del sistema | Valor |
|---|---|
| **Nombre** | Compresor de Aire de Tornillo |
| **Código** | COM-001 |
| **Categoría** | Compresores |
| **Ubicación** | (definir — ej. Cuarto de Compresores) |
| **Marca** | Atlas Copco |
| **Modelo** | GA 30 |
| **Serial** | AC-2022-30551 |
| **Fecha Instalación** | 2022-01-20 |
| **Vencimiento Garantía** | 2025-01-20 |
| **Criticidad** | Alta |
| **Especificaciones Técnicas** | 30 kW · 7.5 bar · Caudal 5.1 m³/min · Tornillo rotativo · Tanque pulmón 500 L |

---

# 👷 PERSONAL TÉCNICO (registrar 2)
| Nombre | Rol | Especialización |
|---|---|---|
| Carlos Andrés Pérez | Técnico Mecánico | Equipos Rotativos |
| Ana María Gómez | Técnica Electricista | Sistemas Eléctricos |

---

# 🛠️ PLANES DE MANTENIMIENTO A CONSTRUIR
> Crea cada plan en *Mtto. Preventivo → Nuevo Plan*. Las **tareas del checklist se separan con `|`**.
> Debes diseñar **al menos los planes marcados como obligatorios**. Asigna el técnico adecuado según la especialidad.

### Bomba Centrífuga (BOM-001)
- **(Obligatorio)** *Inspección semanal de bomba* — Frecuencia: **7 días** · Horas: 1 · Trigger: Tiempo · Técnico: Mecánico
  - Tareas: `Medir vibración | Verificar temperatura de rodamientos | Revisar fugas en sello | Verificar presión succión/descarga | Revisar nivel de aceite`
- **(Obligatorio)** *Mantenimiento trimestral de bomba* — Frecuencia: **90 días** · Horas: 4 · Trigger: Tiempo
  - Tareas: `Cambio de aceite | Inspección de sello mecánico | Alineación láser | Análisis de vibraciones | Reapriete de pernos de base`

### Motor Eléctrico (MOT-001)
- **(Obligatorio)** *Inspección termográfica mensual* — Frecuencia: **30 días** · Horas: 1.5 · Trigger: Tiempo · Técnico: Electricista
  - Tareas: `Termografía de conexiones | Medición de corriente por fase | Verificar temperatura de carcasa | Limpieza de ventilación`
- *(Opcional)* *Medición de aislamiento trimestral* — Frecuencia: **90 días** · Horas: 2 · Trigger: Tiempo
  - Tareas: `Medición con megóhmetro | Reapriete de bornes | Inspección de aislamiento`

### Compresor de Aire (COM-001)
- **(Obligatorio)** *Inspección semanal de compresor* — Frecuencia: **7 días** · Horas: 0.5 · Trigger: Tiempo
  - Tareas: `Drenar condensado | Verificar presión de trabajo | Revisar fugas de aire | Verificar temperatura`
- **(Obligatorio)** *Cambio de filtros y aceite* — Trigger: **Por Medidor** · Intervalo: **2000** · Unidad medidor: **horas** · Horas: 3
  - Tareas: `Cambio de filtro de aire | Cambio de filtro de aceite | Cambio de aceite | Revisión de correas`

> 🧠 **Reto de planeación:** define la **Próxima Ejecución** de cada plan para que el primer mantenimiento del año quede bien distribuido. Luego abre el **Calendario** y verifica que no se te acumulen todas las tareas el mismo día.

---

# 📝 Rúbrica de evaluación (100 pts)
| Criterio | Pts |
|---|---|
| 3 equipos registrados con todos los campos correctos (incl. criticidad y specs) | 30 |
| 2 técnicos registrados | 10 |
| Planes preventivos obligatorios creados y bien parametrizados (frecuencia/unidad/horas) | 25 |
| Asignación correcta de técnico según especialidad | 10 |
| Uso correcto del trigger **por medidor** en el compresor | 10 |
| Distribución lógica de fechas (calendario sin sobrecarga) | 10 |
| Descarga de los PDF (calendario anual + plan semanal) | 5 |

---
*MaintPro CMMS · UNIPAZ — TOSEM 2026*
