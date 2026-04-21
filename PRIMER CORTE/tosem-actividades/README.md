# 🔧 TOSEM — Actividades Interactivas

**Instituto Universitario de la Paz — UNIPAZ**  
Tecnología en Operación y Sostenimiento de Equipos Mecánicos (TOSEM)  
Unidad Formativa 2 — Diagnóstico de Fallas · 2026-I

---

## 📋 Contenido

### AMEF Interactivo (`index.html`)
Presentación interactiva completa sobre **Análisis de Modos y Efectos de Falla (AMEF/FMEA)** que incluye:

- 📘 **Teoría completa**: Definición, origen, tipos de AMEF, terminología clave
- 📊 **Escalas interactivas**: Severidad, Ocurrencia, Detección con tabs navegables
- 🔧 **Guía paso a paso**: Los 9 pasos para elaborar un AMEF
- 🎯 **Práctica guiada**: Escenario de Bomba Centrífuga P-101 con matriz editable
- 💾 **Sistema de guardado**: Los estudiantes envían su matriz AMEF al profesor

---

## 🚀 Configuración de Google Sheets (para recibir trabajos)

### Paso 1: Crear la hoja de cálculo
1. Ve a [Google Sheets](https://sheets.google.com) y crea una nueva hoja de cálculo
2. Nómbrala: `AMEF - Respuestas Estudiantes TOSEM`

### Paso 2: Configurar el script
1. En Google Sheets, ve a **Extensiones → Apps Script**
2. Borra el código que aparece y pega el contenido del archivo `google-apps-script.js`
3. Guarda el proyecto (Ctrl+S) con el nombre `AMEF API`
4. Ejecuta la función `setup` (selecciónala del dropdown y presiona ▶️)
   - Te pedirá permisos: **Autoriza** con tu cuenta de Google
5. Esto creará la hoja `Respuestas AMEF` con las columnas correctas

### Paso 3: Desplegar como aplicación web
1. Click en **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Configurar:
   - Descripción: `AMEF API`
   - Ejecutar como: **Tu cuenta (marlon.gomez9603@gmail.com)**
   - Quién tiene acceso: **Cualquier persona**
4. Click en **Implementar**
5. **Copia la URL** que te genera (algo como `https://script.google.com/macros/s/ABC.../exec`)

### Paso 4: Conectar la página web
1. Abre `index.html`
2. Busca la línea:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'TU_URL_AQUI';
   ```
3. Reemplaza `'TU_URL_AQUI'` con la URL copiada:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/ABC.../exec';
   ```
4. Guarda y sube los cambios a GitHub

### Paso 5: ¡Listo!
Cuando los estudiantes llenen su AMEF y presionen **"Guardar y Enviar"**, los datos llegarán automáticamente a tu Google Sheet.

---

## 📊 ¿Cómo ver los resultados?

1. Abre la hoja de cálculo `AMEF - Respuestas Estudiantes TOSEM`
2. Ve a la pestaña `Respuestas AMEF`
3. Verás una tabla con:
   - **Fecha/Hora** de envío
   - **Nombre y Cédula** del estudiante
   - **Cada fila del AMEF** con todos los campos
   - **NPR** con colores: 🔴 Alto (≥200), 🟡 Medio (100-199), 🟢 Bajo (<100)

### Tips para revisar:
- **Filtrar por estudiante**: Usa los filtros de Google Sheets (Datos → Crear filtro)
- **Ordenar por NPR**: Click en la columna NPR para ordenar
- **Buscar por cédula**: Ctrl+F para buscar un estudiante específico

---

## 🌐 GitHub Pages

Este sitio se despliega automáticamente en GitHub Pages:

**URL**: `https://marlongomez9603-netizen.github.io/tosem-actividades/`

---

## 📁 Estructura del proyecto

```
tosem-actividades/
├── index.html              # Página principal (AMEF Interactivo)
├── google-apps-script.js   # Script para Google Sheets (copiar a Apps Script)
└── README.md               # Este archivo
```

---

## 👨‍🏫 Créditos

**Profesor:** Marlon Gómez  
**Programa:** TOSEM — UNIPAZ  
**Periodo:** 2026-I
