// ============================================================
//  TOSEM - Examen Corte 1 | Google Apps Script Backend
//  Pega este código en: script.google.com (nuevo proyecto)
//  Luego despliega como "Aplicación web" (acceso: Cualquier)
// ============================================================

// ID de tu Google Sheet (cópialo de la URL del sheet)
const SHEET_ID    = "16MjRfGuAdt3uMQvTinqtnQj3LX5iaucxaZCOQBcPxZE";
const SHEET_NAME  = "Resultados_Examen"; // Nombre de la pestaña

// ──────────────────────────────────────────────────────────
//  Punto de entrada HTTP – acepta GET y POST
// ──────────────────────────────────────────────────────────
function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Cabeceras CORS para que el fetch del HTML no sea bloqueado
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    // Leer el payload (viene como JSON en el body, o como params en GET)
    let data;
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    } else {
      throw new Error("No se recibieron datos.");
    }

    // Abrir hoja y registrar fila
    const sheet = getOrCreateSheet();
    sheet.appendRow([
      data.timestamp      || new Date().toISOString(),
      data.nombre         || "N/A",
      data.codigo         || "N/A",
      parseFloat(data.nota) || 0,
      parseInt(data.infracciones_fraude) || 0,
      parseInt(data.err_r1) || 0,
      parseInt(data.err_r2) || 0,
      parseInt(data.err_r3) || 0,
      parseInt(data.err_r4) || 0,
      calcResultado(parseFloat(data.nota))
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", message: "Datos guardados." }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ──────────────────────────────────────────────────────────
//  Obtiene o crea la pestaña con los encabezados correctos
// ──────────────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);

    // Encabezados
    const headers = [
      "Timestamp",
      "Nombre Completo",
      "Código Estudiantil",
      "Nota Final",
      "Infracciones Anti-Fraude",
      "Errores Fase 1 (Triaje)",
      "Errores Fase 2 (Planificación)",
      "Errores Fase 3 (5 Por Qué)",
      "Errores Fase 4 (Ishikawa)",
      "Resultado"
    ];
    sheet.appendRow(headers);

    // Formato de encabezados
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1e3a5f");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);

    // Ancho de columnas
    sheet.setColumnWidth(1, 200); // Timestamp
    sheet.setColumnWidth(2, 220); // Nombre
    sheet.setColumnWidth(3, 160); // Código
    sheet.setColumnWidth(4, 100); // Nota
    sheet.setColumnWidth(10, 120); // Resultado
  }

  return sheet;
}

// ──────────────────────────────────────────────────────────
//  Determina si aprobó o reprobó
// ──────────────────────────────────────────────────────────
function calcResultado(nota) {
  if (isNaN(nota) || nota === 0) return "ANULADO (Fraude)";
  if (nota >= 3.0) return "APROBADO ✅";
  return "REPROBADO ❌";
}
