// ============================================================
// GOOGLE APPS SCRIPT — Receptor de datos AMEF
// ============================================================
// INSTRUCCIONES:
// 1. Ve a https://script.google.com
// 2. Crea un nuevo proyecto
// 3. Pega este código completo
// 4. Ejecuta la función "setup" una vez (esto crea la hoja)
// 5. Despliega como "Aplicación web":
//    - Ejecutar como: Tu cuenta
//    - Acceso: Cualquier persona
// 6. Copia la URL del despliegue
// 7. Pega esa URL en index.html donde dice 'TU_URL_AQUI'
// ============================================================

function setup() {
    // Crea la hoja de cálculo con las columnas necesarias
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Respuestas AMEF');
    if (!sheet) {
        sheet = ss.insertSheet('Respuestas AMEF');
    }

    // Encabezados
    const headers = [
        'Fecha/Hora', 'Nombre', 'Cédula', 'Fila #',
        'Componente', 'Función', 'Modo de Falla', 'Efecto',
        'Severidad (S)', 'Causa', 'Ocurrencia (O)',
        'Control Actual', 'Detección (D)', 'NPR', 'Acción Recomendada'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // Formato de encabezados
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1a3a5c');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // Congelar primera fila
    sheet.setFrozenRows(1);

    // Auto-ajustar anchos
    for (let i = 1; i <= headers.length; i++) {
        sheet.autoResizeColumn(i);
    }

    Logger.log('✅ Hoja "Respuestas AMEF" configurada correctamente.');
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let sheet = ss.getSheetByName('Respuestas AMEF');

        if (!sheet) {
            setup();
            sheet = ss.getSheetByName('Respuestas AMEF');
        }

        const nombre = data.nombre || '';
        const cedula = data.cedula || '';
        const fecha = data.fecha || new Date().toLocaleString();
        const filas = data.filas || [];

        filas.forEach((fila, index) => {
            const row = [
                fecha,
                nombre,
                cedula,
                index + 1,
                fila.componente || '',
                fila.funcion || '',
                fila.modo_falla || '',
                fila.efecto || '',
                fila.severidad || '',
                fila.causa || '',
                fila.ocurrencia || '',
                fila.control || '',
                fila.deteccion || '',
                fila.npr || '',
                fila.accion || ''
            ];
            sheet.appendRow(row);
        });

        // Colorear NPR según nivel de riesgo
        const lastRow = sheet.getLastRow();
        const startRow = lastRow - filas.length + 1;
        for (let i = startRow; i <= lastRow; i++) {
            const nprCell = sheet.getRange(i, 14); // Columna NPR
            const nprValue = parseInt(nprCell.getValue());
            if (nprValue >= 200) {
                nprCell.setBackground('#fde8e8').setFontColor('#c0392b').setFontWeight('bold');
            } else if (nprValue >= 100) {
                nprCell.setBackground('#fff3e0').setFontColor('#e65100').setFontWeight('bold');
            } else if (nprValue > 0) {
                nprCell.setBackground('#e8f5e9').setFontColor('#1b5e20').setFontWeight('bold');
            }
        }

        return ContentService
            .createTextOutput(JSON.stringify({ status: 'ok', rows: filas.length }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', message: 'AMEF API activa' }))
        .setMimeType(ContentService.MimeType.JSON);
}
