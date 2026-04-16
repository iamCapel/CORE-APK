# Script para reconstruir la APK con las correcciones de notificaciones
# Ejecutar desde la raiz del proyecto

Write-Host "Reconstruyendo APK con correcciones de notificaciones..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Sincronizar archivos de Capacitor
Write-Host "Paso 1/3: Sincronizando archivos de Capacitor..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en npm build" -ForegroundColor Red
    exit 1
}

npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en cap sync" -ForegroundColor Red
    exit 1
}

Write-Host "Sincronizacion completada" -ForegroundColor Green
Write-Host ""

# Paso 2: Limpiar build anterior
Write-Host "Paso 2/3: Limpiando build anterior..." -ForegroundColor Yellow
cd android
.\gradlew.bat clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en gradle clean" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..

Write-Host "Limpieza completada" -ForegroundColor Green
Write-Host ""

# Paso 3: Compilar APK de Debug
Write-Host "Paso 3/3: Compilando APK..." -ForegroundColor Yellow
cd android
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en compilacion" -ForegroundColor Red
    cd ..
    exit 1
}
cd ..

Write-Host ""
Write-Host "APK compilada exitosamente con las correcciones de notificaciones!" -ForegroundColor Green
Write-Host ""
Write-Host "Ubicacion de las APKs:" -ForegroundColor Cyan
Write-Host "   android\app\build\outputs\apk\debug\" -ForegroundColor White
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Instalar la APK en tu dispositivo" -ForegroundColor White
Write-Host "   2. Seguir la guia: GUIA_ACTIVAR_NOTIFICACIONES_ANDROID.md" -ForegroundColor White
Write-Host "   3. Configurar permisos de bateria y notificaciones" -ForegroundColor White
Write-Host "   4. Probar enviando un mensaje" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE para Xiaomi/MIUI:" -ForegroundColor Red
Write-Host "   - Configurar Sin restricciones en ahorro de bateria" -ForegroundColor White
Write-Host "   - Activar Inicio automatico" -ForegroundColor White
Write-Host "   - Bloquear la app en recientes" -ForegroundColor White
Write-Host ""
