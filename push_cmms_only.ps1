# ============================================================
# Script: Subir SOLO cmms-app a GitHub (raiz del repo)
# ============================================================

$ErrorActionPreference = "Stop"
$appPath    = "PRIMER CORTE\cmms-app"
$remoteUrl  = "https://github.com/marlongomez9603-netizen/CMMS.git"
$tempDir    = "$env:TEMP\cmms_deploy_$(Get-Random)"

Write-Host "`n[1/5] Copiando cmms-app a carpeta temporal..." -ForegroundColor Cyan
Copy-Item -Recurse -Path $appPath -Destination $tempDir
Write-Host "      OK -> $tempDir"

Write-Host "`n[2/5] Inicializando repositorio git en carpeta temporal..." -ForegroundColor Cyan
Set-Location $tempDir
git init
git config user.email "marlon.gomez9603gmail.com"
git config user.name  "marlongomez9603-netizen"

Write-Host "`n[3/5] Agregando todos los archivos..." -ForegroundColor Cyan
git add -A
git commit -m "feat: MaintPro CMMS v4.2 - Sync en tiempo real + Aprobacion de compras

Nuevas funcionalidades v4.2:
- Sincronizacion en TIEMPO REAL via Firestore onSnapshot (docente -> estudiante)
- Inyeccion de fallas del docente se refleja instantaneamente en el estudiante
- Aprobacion/Rechazo de compras con notificaciones al estudiante
- Boton Vista Tecnico visible en topbar para dispositivos moviles
- Flash visual y vibracion al recibir alertas de fallas criticas
- Prevencion de memory leaks en listeners temporales (DataStore options.listen)

Funcionalidades existentes:
- Login multi-estudiante por cedula (datos aislados por usuario)
- 8 modulos: Dashboard KPIs, Activos, OTs, PM, Inventario, Personal, Compras, Reportes
- Exportacion de OTs en PDF profesional (jsPDF + autoTable)
- Sistema de notificaciones en tiempo real (campana con badge animado)
- Vista Tecnico Operativo: Mis Tareas + Calendario Semanal (Lun-Dom)
- Centro de Control Docente: Ranking en vivo + Inyeccion de Averias
- Base de datos hibrida: localStorage + Firebase Firestore (cloud backup)
- KPIs automaticos: MTTR, MTBF, Disponibilidad, Cumplimiento PM
- Flujo de aprobacion PAM: compras mayores a 1.000.000 COP requieren docente"

Write-Host "`n[4/5] Conectando con GitHub y subiendo (force)..." -ForegroundColor Cyan
git remote add origin $remoteUrl
git push --force origin HEAD:main

Write-Host "`n[5/5] Limpiando carpeta temporal..." -ForegroundColor Cyan
Set-Location $env:USERPROFILE
Remove-Item -Recurse -Force $tempDir

Write-Host "`n✅ LISTO. El repositorio GitHub ahora contiene SOLO la app cmms-app." -ForegroundColor Green
Write-Host "   URL: https://github.com/marlongomez9603-netizen/CMMS" -ForegroundColor Yellow
