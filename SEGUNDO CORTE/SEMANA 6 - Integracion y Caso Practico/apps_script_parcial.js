// ================================================================
// GOOGLE APPS SCRIPT — Parcial TOSEM Segundo Corte
// ================================================================
// INSTRUCCIONES:
// 1. Ve a https://script.google.com
// 2. Pega este código
// 3. Implementar → Nueva implementación → Aplicación web
// 4. Ejecutar como: "Yo mismo" | Acceso: "Cualquier persona"
// 5. Copia la URL y reemplázala en parcial_segundo_corte.html
// ================================================================

const SHEET_ID = "1RjDnWyB16_eqnrZGMgH_MWoLoYCG-cITCPJj53hr-6w";

// ID de la carpeta "parcial" en Google Drive
// INSTRUCCIÓN: Crea una carpeta llamada "parcial" en tu Drive y pega su ID aquí
// Para obtener el ID: abre la carpeta → la URL será drive.google.com/drive/folders/XXXXX → copia XXXXX
const PARCIAL_FOLDER_ID = "1vwi2-T7SJzWkynhSpgtf1xt9EAgMysDd";

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var data = JSON.parse(e.postData.contents);
    
    // === GUARDAR PDF EN DRIVE ===
    if (data.tipo === 'PARCIAL_PDF') {
      return savePDFToDrive(data);
    }
    
    // === PARCIAL PREGUNTAS ABIERTAS ===
    if (data.tipo === 'PARCIAL_ABIERTA') {
      var sheet = ss.getSheetByName('Parcial_Abierta');
      if (!sheet) {
        sheet = ss.insertSheet('Parcial_Abierta');
        sheet.appendRow([
          "Nombre", "Cédula", "Tiempo", "Hora Entrega",
          "Anulado", "Observación",
          "P1 - Planificación (20pts)",
          "P2 - Correctivo/OT (20pts)",
          "Nota P1", "Nota P2", "TOTAL"
        ]);
        var hdr = sheet.getRange(1, 1, 1, 11);
        hdr.setFontWeight("bold").setBackground("#1a2332").setFontColor("#fff");
        sheet.setFrozenRows(1);
        sheet.setColumnWidth(7, 500);
        sheet.setColumnWidth(8, 500);
      }
      
      // Check duplicate
      var rows = sheet.getDataRange().getValues();
      var existingRow = -1;
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][1]).trim() === String(data.cedula).trim()) {
          existingRow = i + 1;
          break;
        }
      }
      
      var rowData = [
        data.nombre, data.cedula, data.tiempo, data.hora_entrega,
        data.anulado, data.razon_anulacion || "",
        data.p1_planificacion || "",
        data.p2_correctivo_ot || "",
        "", "", "" // Columns for manual grading
      ];
      
      if (existingRow > 0) {
        sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      sheet.autoResizeColumns(1, 6);
    }
    
    // === QUIZ SELECCIÓN MÚLTIPLE (legacy) ===
    if (!data.tipo || data.tipo === 'QUIZ') {
      var sheet2 = ss.getSheetByName("Resultados");
      if (!sheet2) {
        sheet2 = ss.insertSheet("Resultados");
        sheet2.appendRow(["Nombre","Cédula","Calificación","Correctas","Total","Tiempo","Hora","Anulado","Obs"]);
        sheet2.getRange(1,1,1,9).setFontWeight("bold").setBackground("#1a2332").setFontColor("#fff");
        sheet2.setFrozenRows(1);
      }
      var r2 = sheet2.getDataRange().getValues();
      var ex2 = -1;
      for (var j=1;j<r2.length;j++) {
        if(String(r2[j][1]).trim()===String(data.cedula).trim()){ex2=j+1;break;}
      }
      var rd=[data.nombre,data.cedula,data.calificacion||0,
              (data.correctas||0)+"/"+(data.total||0),data.total||0,
              data.tiempo,data.hora_entrega,data.anulado||"NO",data.razon_anulacion||""];
      if(ex2>0)sheet2.getRange(ex2,1,1,rd.length).setValues([rd]);
      else sheet2.appendRow(rd);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({status:"ok"})
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    return ContentService.createTextOutput(
      JSON.stringify({status:"error",message:err.toString()})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// === SAVE PDF TO GOOGLE DRIVE ===
function savePDFToDrive(data) {
  try {
    var folder;
    if (PARCIAL_FOLDER_ID && PARCIAL_FOLDER_ID !== "%%FOLDER_ID%%") {
      folder = DriveApp.getFolderById(PARCIAL_FOLDER_ID);
    } else {
      // Auto-create folder if not configured
      var folders = DriveApp.getFoldersByName("parcial");
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder("parcial");
      }
    }
    
    // Decode base64 PDF
    var pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(data.pdfBase64),
      'application/pdf',
      data.cedula + '.pdf'
    );
    
    // Check if file already exists, update if so
    var existing = folder.getFilesByName(data.cedula + '.pdf');
    if (existing.hasNext()) {
      var oldFile = existing.next();
      oldFile.setTrashed(true); // Move old to trash
    }
    
    var file = folder.createFile(pdfBlob);
    file.setDescription('Parcial CMMS - ' + data.nombre + ' - ' + new Date().toLocaleString());
    
    // Also log to sheet
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var logSheet = ss.getSheetByName('Parcial_CMMS');
    if (!logSheet) {
      logSheet = ss.insertSheet('Parcial_CMMS');
      logSheet.appendRow([
        "Nombre", "Cédula", "Hora Entrega", "Sector", "Empresa",
        "Activos", "Planes PM", "OTs", "OTs Cerradas",
        "PDF URL", "Estado"
      ]);
      logSheet.getRange(1,1,1,11).setFontWeight("bold").setBackground("#1a2332").setFontColor("#fff");
      logSheet.setFrozenRows(1);
    }
    
    var logRows = logSheet.getDataRange().getValues();
    var existLog = -1;
    for (var k=1;k<logRows.length;k++) {
      if(String(logRows[k][1]).trim()===String(data.cedula).trim()){existLog=k+1;break;}
    }
    
    var logRow = [
      data.nombre, data.cedula, 
      new Date().toLocaleString('es-CO',{timeZone:'America/Bogota'}),
      data.sector || "", data.empresa || "",
      data.totalAssets || 0, data.totalPM || 0,
      data.totalOTs || 0, data.closedOTs || 0,
      file.getUrl(), "Entregado"
    ];
    
    if(existLog>0) logSheet.getRange(existLog,1,1,logRow.length).setValues([logRow]);
    else logSheet.appendRow(logRow);
    
    return ContentService.createTextOutput(
      JSON.stringify({status:"ok", url: file.getUrl()})
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    return ContentService.createTextOutput(
      JSON.stringify({status:"error", message: err.toString()})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function testSetup() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  Logger.log("Conectado a: " + ss.getName());
  // Test folder access
  var folders = DriveApp.getFoldersByName("parcial");
  if (folders.hasNext()) {
    Logger.log("Carpeta 'parcial' encontrada: " + folders.next().getId());
  } else {
    var f = DriveApp.createFolder("parcial");
    Logger.log("Carpeta 'parcial' creada: " + f.getId());
  }
}
