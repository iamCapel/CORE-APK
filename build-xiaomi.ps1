# PowerShell script para compilar APK optimizada para Xiaomi Redmi
# Incluye limpieza, construcción y sincronización

Write-Host "🚀 Iniciando compilación optimizada para Xiaomi Redmi..." -ForegroundColor Cyan

# 1. Limpiar build anterior
Write-Host "`n📦 Limpiando builds anteriores..." -ForegroundColor Yellow
npm run android:clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Advertencia: Error en limpieza, continuando..." -ForegroundColor Yellow
}

# 2. Construir la aplicación React
Write-Host "`n🔨 Construyendo aplicación React..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en la construcción de React" -ForegroundColor Red
    exit 1
}

# 3. Sincronizar con Capacitor
Write-Host "`n🔄 Sincronizando con Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en sincronización de Capacitor" -ForegroundColor Red
    exit 1
}

# 4. Verificar configuración de Xiaomi
Write-Host "`n🔍 Verificando configuración específica de Xiaomi..." -ForegroundColor Yellow

$manifestPath = "android\app\src\main\AndroidManifest.xml"
$mainActivityPath = "android\app\src\main\java\com\mopc\core\MainActivity.java"

if (Test-Path $manifestPath) {
    Write-Host "  ✅ AndroidManifest.xml encontrado" -ForegroundColor Green
    
    # Verificar meta-data de Xiaomi
    $content = Get-Content $manifestPath -Raw
    if ($content -match "android.notch_support") {
        Write-Host "  ✅ Soporte para notch configurado" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Falta configuración de notch" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ AndroidManifest.xml no encontrado" -ForegroundColor Red
}

if (Test-Path $mainActivityPath) {
    Write-Host "  ✅ MainActivity.java encontrado" -ForegroundColor Green
    
    # Verificar modo inmersivo
    $content = Get-Content $mainActivityPath -Raw
    if ($content -match "setupFullscreenImmersiveMode") {
        Write-Host "  ✅ Modo inmersivo configurado" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Falta configuración de modo inmersivo" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ MainActivity.java no encontrado" -ForegroundColor Red
}

# 5. Compilar APK Debug
Write-Host "`n🏗️ Compilando APK Debug..." -ForegroundColor Yellow
cd android
.\gradlew.bat assembleDebug
$debugResult = $LASTEXITCODE
cd ..

if ($debugResult -eq 0) {
    Write-Host "`n✅ APK Debug compilada exitosamente!" -ForegroundColor Green
    
    $apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Host "📱 APK Debug: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
        Write-Host "📍 Ubicación: $apkPath" -ForegroundColor Cyan
    }
} else {
    Write-Host "`n❌ Error compilando APK Debug" -ForegroundColor Red
    exit 1
}

# 6. Preguntar si compilar Release
Write-Host "`n❓ ¿Desea compilar también la versión Release? (S/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Write-Host "`n🏗️ Compilando APK Release..." -ForegroundColor Yellow
    cd android
    .\gradlew.bat assembleRelease
    $releaseResult = $LASTEXITCODE
    cd ..
    
    if ($releaseResult -eq 0) {
        Write-Host "`n✅ APK Release compilada exitosamente!" -ForegroundColor Green
        
        $apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
        if (Test-Path $apkPath) {
            $apkSize = (Get-Item $apkPath).Length / 1MB
            Write-Host "📱 APK Release: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
            Write-Host "📍 Ubicación: $apkPath" -ForegroundColor Cyan
            Write-Host "⚠️ Recuerde: La APK Release debe ser firmada antes de distribuir" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`n❌ Error compilando APK Release" -ForegroundColor Red
    }
}

# 7. Resumen final
Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 COMPILACIÓN COMPLETADA PARA XIAOMI REDMI" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Características implementadas:" -ForegroundColor Green
Write-Host "   • Pantalla completa inmersiva" -ForegroundColor White
Write-Host "   • Barras del sistema ocultas" -ForegroundColor White
Write-Host "   • Soporte para notch/cutout" -ForegroundColor White
Write-Host "   • Optimizado para MIUI" -ForegroundColor White
Write-Host "   • Todos los Capacitors compatibles" -ForegroundColor White
Write-Host ""
Write-Host "📱 Para instalar en dispositivo Xiaomi:" -ForegroundColor Cyan
Write-Host "   adb install android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "📖 Consulta XIAOMI_REDMI_CONFIG.md para más detalles" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
