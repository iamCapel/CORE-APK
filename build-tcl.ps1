# Script para compilar APK optimizada para TCL 20L Plus
# Con soporte de pantalla completa y compatibilidad total de Capacitor

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Compilando APK para TCL 20L Plus       " -ForegroundColor Cyan
Write-Host "   Pantalla Completa + Capacitor Full     " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Limpiar compilacion anterior
Write-Host "[1/5] Limpiando compilacion anterior..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat clean
Set-Location ..

# 2. Construir proyecto React
Write-Host "[2/5] Construyendo proyecto React..." -ForegroundColor Yellow
npm run build

# Verificar que build fue exitoso
if (-not (Test-Path "build\index.html")) {
    Write-Host "ERROR: Build de React fallo" -ForegroundColor Red
    exit 1
}

# 3. Sincronizar con Capacitor
Write-Host "[3/5] Sincronizando con Capacitor..." -ForegroundColor Yellow
npx cap sync android

# 4. Copiar recursos de Firebase si existen
Write-Host "[4/5] Verificando recursos de Firebase..." -ForegroundColor Yellow
if (Test-Path "android\app\google-services.json") {
    Write-Host "   google-services.json encontrado OK" -ForegroundColor Green
} else {
    Write-Host "   ADVERTENCIA: google-services.json no encontrado" -ForegroundColor Yellow
}

# 5. Compilar APK para TCL
Write-Host "[5/5] Compilando APK para TCL 20L Plus..." -ForegroundColor Yellow
Set-Location android

# Compilar flavor tcl20l en modo release
.\gradlew.bat assembleTcl20lRelease

# Tambien compilar debug por si se necesita
.\gradlew.bat assembleTcl20lDebug

Set-Location ..

# Verificar si la compilacion fue exitosa
$apkRelease = "android\app\build\outputs\apk\tcl20l\release\app-tcl20l-release-unsigned.apk"
$apkDebug = "android\app\build\outputs\apk\tcl20l\debug\app-tcl20l-debug.apk"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "          COMPILACION COMPLETADA           " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

if (Test-Path $apkRelease) {
    Write-Host "APK Release generada:" -ForegroundColor Green
    Write-Host "  $apkRelease" -ForegroundColor White
    $sizeRelease = (Get-Item $apkRelease).Length / 1MB
    Write-Host "  Tamaño: $([math]::Round($sizeRelease, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "APK Release no generada" -ForegroundColor Red
}

Write-Host ""

if (Test-Path $apkDebug) {
    Write-Host "APK Debug generada:" -ForegroundColor Green
    Write-Host "  $apkDebug" -ForegroundColor White
    $sizeDebug = (Get-Item $apkDebug).Length / 1MB
    Write-Host "  Tamaño: $([math]::Round($sizeDebug, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "APK Debug no generada" -ForegroundColor Red
}

Write-Host ""
Write-Host "Caracteristicas habilitadas:" -ForegroundColor Cyan
Write-Host "  - Pantalla completa (immersive mode)" -ForegroundColor White
Write-Host "  - Soporte completo de Capacitor 7.x" -ForegroundColor White
Write-Host "  - Camera + Geolocation" -ForegroundColor White
Write-Host "  - Push Notifications" -ForegroundColor White
Write-Host "  - Optimizado para TCL 20L Plus" -ForegroundColor White
Write-Host ""
Write-Host "Para instalar en dispositivo TCL:" -ForegroundColor Yellow
Write-Host "  adb install $apkDebug" -ForegroundColor White
Write-Host ""

