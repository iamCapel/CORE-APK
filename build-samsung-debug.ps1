# Script para compilar APK DEBUG para Samsung Galaxy A04s
# Version de desarrollo para pruebas

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Compilando APK DEBUG para Samsung A04s " -ForegroundColor Cyan
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

# 5. Compilar APK DEBUG para Samsung A04s
Write-Host "[5/5] Compilando APK DEBUG para Samsung Galaxy A04s..." -ForegroundColor Yellow
Set-Location android

# Compilar flavor a04s en modo debug
.\gradlew.bat assembleA04sDebug

Set-Location ..

# Verificar si la compilacion fue exitosa
if (Test-Path "android\app\build\outputs\apk\a04s\debug\app-a04s-debug.apk") {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "   COMPILACION EXITOSA" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK generada en:" -ForegroundColor Cyan
    Write-Host "android\app\build\outputs\apk\a04s\debug\app-a04s-debug.apk" -ForegroundColor White
    Write-Host ""
    Write-Host "Puedes instalarla con:" -ForegroundColor Yellow
    Write-Host "adb install android\app\build\outputs\apk\a04s\debug\app-a04s-debug.apk" -ForegroundColor White
    Write-Host ""
    
    # Copiar APK a carpeta de instalables
    if (-not (Test-Path "APKs_Instalables")) {
        New-Item -ItemType Directory -Path "APKs_Instalables"
    }
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $destFile = "APKs_Instalables\MOPC-Samsung-A04s-debug-$timestamp.apk"
    Copy-Item "android\app\build\outputs\apk\a04s\debug\app-a04s-debug.apk" $destFile
    Write-Host "Copia guardada en: $destFile" -ForegroundColor Cyan
    
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "   ERROR EN LA COMPILACION" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisa los logs de Gradle arriba para mas detalles" -ForegroundColor Yellow
    exit 1
}
