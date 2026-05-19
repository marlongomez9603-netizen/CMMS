# 📊 Configuración Google Sheets para el Quiz

## Paso 1: Crear la Hoja de Cálculo

1. Ve a [Google Sheets](https://sheets.google.com) y crea una nueva hoja
2. Nómbrala: **"Quiz Segundo Corte - TOSEM 2026"**
3. En la fila 1, escribe estos encabezados (uno por columna):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Nombre | Cédula | Calificación | Correctas | Total | Tiempo | Hora Entrega | Anulado |

## Paso 2: Crear el Apps Script

1. En la hoja de cálculo, ve a **Extensiones → Apps Script**
2. Borra todo el código existente
3. Pega este código:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Buscar si el estudiante ya tiene registro
    var rows = sheet.getDataRange().getValues();
    var existingRow = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === String(data.cedula)) {
        existingRow = i + 1;
        break;
      }
    }
    
    var rowData = [
      data.nombre,
      data.cedula,
      data.calificacion,
      data.correctas + "/" + data.total,
      data.total,
      data.tiempo,
      data.hora_entrega,
      data.anulado + (data.razon_anulacion ? " - " + data.razon_anulacion : "")
    ];
    
    if (existingRow > 0) {
      // Actualizar fila existente
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Agregar nueva fila
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({status: "ok"})
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({status: "error", message: err.toString()})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Paso 3: Desplegar como Web App

1. Clic en **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Configurar:
   - **Descripción:** Quiz TOSEM
   - **Ejecutar como:** Yo mismo
   - **Quién tiene acceso:** **Cualquier persona**
4. Clic en **Implementar**
5. Autoriza los permisos cuando lo pida
6. **Copia la URL** que te da (algo como `https://script.google.com/macros/s/AKfycb.../exec`)

## Paso 4: Conectar con el Quiz

1. Abre `quiz_segundo_corte.html`
2. Busca la línea: `const SHEET_URL="%%SHEET_URL%%";`
3. Reemplaza `%%SHEET_URL%%` con la URL que copiaste:

```javascript
const SHEET_URL="https://script.google.com/macros/s/TU_ID_AQUI/exec";
```

4. Sube el archivo a GitHub

## ✅ Listo

Cada vez que un estudiante complete (o se le anule) el quiz, los datos llegarán automáticamente a tu hoja de cálculo con:
- Nombre del estudiante
- Número de cédula
- Calificación sobre 100
- Preguntas correctas / total
- Tiempo que tardó
- Hora de entrega (hora Colombia -5 GMT)
- Si fue anulado y la razón
