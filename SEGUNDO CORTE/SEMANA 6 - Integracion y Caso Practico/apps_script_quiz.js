// ================================================================
// GOOGLE APPS SCRIPT — Quiz TOSEM Segundo Corte
// ================================================================
// INSTRUCCIONES:
// 1. Ve a https://script.google.com y crea un nuevo proyecto
// 2. Pega este código completo (reemplazando todo lo que haya)
// 3. Clic en "Implementar" → "Nueva implementación"
// 4. Tipo: "Aplicación web"
// 5. Ejecutar como: "Yo mismo"
// 6. Quién tiene acceso: "Cualquier persona"
// 7. Clic en "Implementar" → Autoriza los permisos
// 8. COPIA LA URL que te da
// 9. En quiz_segundo_corte.html, reemplaza DEPLOY_ID en la línea
//    const SHEET_URL="https://script.google.com/macros/s/DEPLOY_ID/exec"
//    con la URL completa que copiaste
// ================================================================

const SHEET_ID = "1RjDnWyB16_eqnrZGMgH_MWoLoYCG-cITCPJj53hr-6w";

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName("Resultados");
    
    // Crear hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet("Resultados");
      sheet.appendRow([
        "Nombre",
        "Cédula",
        "Calificación",
        "Correctas",
        "Total Preguntas",
        "Tiempo",
        "Hora Entrega (Bogotá)",
        "Anulado",
        "Observación"
      ]);
      // Formato encabezados
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1a2332");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // Buscar si ya existe registro de este estudiante
    var rows = sheet.getDataRange().getValues();
    var existingRow = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]).trim() === String(data.cedula).trim()) {
        existingRow = i + 1;
        break;
      }
    }
    
    var rowData = [
      data.nombre || "",
      data.cedula || "",
      data.calificacion || 0,
      (data.correctas || 0) + "/" + (data.total || 0),
      data.total || 0,
      data.tiempo || "",
      data.hora_entrega || "",
      data.anulado || "NO",
      data.razon_anulacion || ""
    ];
    
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    // Auto-ajustar columnas
    sheet.autoResizeColumns(1, 9);
    
    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok", message: "Datos guardados" })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Función de prueba (opcional, para verificar conexión)
function testSetup() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  Logger.log("Conectado a: " + ss.getName());
  var sheet = ss.getSheetByName("Resultados");
  if (!sheet) {
    Logger.log("La hoja 'Resultados' se creará automáticamente con el primer envío.");
  } else {
    Logger.log("Hoja 'Resultados' encontrada con " + sheet.getLastRow() + " filas.");
  }
}
