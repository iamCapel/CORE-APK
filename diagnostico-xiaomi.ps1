# 🔧 Script de Diagnóstico para Xiaomi Redmi
# Verifica que todas las configuraciones estén correctas

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📱 DIAGNÓSTICO XIAOMI REDMI - MOPC CORE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Verificar archivos de configuración
Write-Host "📂 Verificando archivos de configuración..." -ForegroundColor Yellow
Write-Host ""

# 1. MainActivity.java
$mainActivityPath = "android\app\src\main\java\com\mopc\core\MainActivity.java"
Write-Host "  Checking MainActivity.java..." -NoNewline
if (Test-Path $mainActivityPath) {
    $content = Get-Content $mainActivityPath -Raw
    if ($content -match "setupFullscreenImmersiveMode" -and $content -match "WindowInsetsController") {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ Falta configuración de pantalla completa" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host " ❌ No encontrado" -ForegroundColor Red
    $allGood = $false
}

# 2. AndroidManifest.xml
$manifestPath = "android\app\src\main\AndroidManifest.xml"
Write-Host "  Checking AndroidManifest.xml..." -NoNewline
if (Test-Path $manifestPath) {
    $content = Get-Content $manifestPath -Raw
    $checks = @(
        @{pattern = "android.notch_support"; name = "Notch support"},
        @{pattern = "android.max_aspect"; name = "Max aspect ratio"},
        @{pattern = "windowLayoutInDisplayCutoutMode"; name = "Cutout mode"}
    )
    
    $manifestOk = $true
    foreach ($check in $checks) {
        if ($content -notmatch $check.pattern) {
            Write-Host " ⚠️ Falta: $($check.name)" -ForegroundColor Yellow
            $manifestOk = $false
        }
    }
    
    if ($manifestOk) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        $allGood = $false
    }
} else {
    Write-Host " ❌ No encontrado" -ForegroundColor Red
    $allGood = $false
}

# 3. styles.xml
$stylesPath = "android\app\src\main\res\values\styles.xml"
Write-Host "  Checking styles.xml..." -NoNewline
if (Test-Path $stylesPath) {
    $content = Get-Content $stylesPath -Raw
    if ($content -match "windowFullscreen" -and $content -match "AppTheme.NoActionBar") {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ Configuración incompleta" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host " ❌ No encontrado" -ForegroundColor Red
    $allGood = $false
}

# 4. colors.xml
$colorsPath = "android\app\src\main\res\values\colors.xml"
Write-Host "  Checking colors.xml..." -NoNewline
if (Test-Path $colorsPath) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ⚠️ No encontrado (crear automáticamente)" -ForegroundColor Yellow
}

# 5. capacitor.config.ts
$capacitorConfigPath = "capacitor.config.ts"
Write-Host "  Checking capacitor.config.ts..." -NoNewline
if (Test-Path $capacitorConfigPath) {
    $content = Get-Content $capacitorConfigPath -Raw
    if ($content -match "splashFullScreen" -and $content -match "splashImmersive") {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ Falta configuración de splash" -ForegroundColor Yellow
    }
} else {
    Write-Host " ❌ No encontrado" -ForegroundColor Red
    $allGood = $false
}

# 6. xiaomi-optimizations.ts
$xiaomiOptPath = "src\xiaomi-optimizations.ts"
Write-Host "  Checking xiaomi-optimizations.ts..." -NoNewline
if (Test-Path $xiaomiOptPath) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌ No encontrado" -ForegroundColor Red
    $allGood = $false
}

# 7. xiaomi-styles.css
$xiaomiStylesPath = "src\xiaomi-styles.css"
Write-Host "  Checking xiaomi-styles.css..." -NoNewline
if (Test-Path $xiaomiStylesPath) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌ No encontrado" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
Write-Host ""

# Verificar package.json
$packagePath = "package.json"
if (Test-Path $packagePath) {
    $packageJson = Get-Content $packagePath -Raw | ConvertFrom-Json
    
    $requiredPackages = @(
        "@capacitor/android",
        "@capacitor/app",
        "@capacitor/camera",
        "@capacitor/core",
        "@capacitor/filesystem",
        "@capacitor/geolocation",
        "@capacitor/push-notifications",
        "@capacitor/splash-screen"
    )
    
    $missingPackages = @()
    foreach ($package in $requiredPackages) {
        if (-not $packageJson.dependencies.$package) {
            $missingPackages += $package
        }
    }
    
    if ($missingPackages.Count -eq 0) {
        Write-Host "  ✅ Todos los Capacitors instalados" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Faltan paquetes:" -ForegroundColor Red
        foreach ($pkg in $missingPackages) {
            Write-Host "     - $pkg" -ForegroundColor Red
        }
        $allGood = $false
    }
}

Write-Host ""
Write-Host "🔌 Verificando dispositivo conectado..." -ForegroundColor Yellow
Write-Host ""

# Verificar ADB
$adbPath = Get-Command adb -ErrorAction SilentlyContinue
if ($adbPath) {
    Write-Host "  ✅ ADB encontrado" -ForegroundColor Green
    
    # Listar dispositivos
    $devices = adb devices
    $deviceLines = $devices -split "`n" | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }
    
    if ($deviceLines.Count -gt 0) {
        Write-Host "  ✅ Dispositivo(s) conectado(s):" -ForegroundColor Green
        foreach ($device in $deviceLines) {
            $deviceId = ($device -split "`t")[0]
            Write-Host "     📱 $deviceId" -ForegroundColor Cyan
            
            # Intentar obtener modelo
            $model = adb -s $deviceId shell getprop ro.product.model 2>$null
            if ($model) {
                Write-Host "        Modelo: $model" -ForegroundColor Gray
            }
            
            # Verificar si es Xiaomi
            $manufacturer = adb -s $deviceId shell getprop ro.product.manufacturer 2>$null
            if ($manufacturer -match "xiaomi" -or $manufacturer -match "redmi") {
                Write-Host "        ✅ Dispositivo Xiaomi detectado" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  ⚠️ No hay dispositivos conectados" -ForegroundColor Yellow
        Write-Host "     Conecta tu Xiaomi Redmi vía USB" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️ ADB no encontrado en PATH" -ForegroundColor Yellow
    Write-Host "     Asegúrate de tener Android SDK instalado" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🏗️ Verificando estado de compilación..." -ForegroundColor Yellow
Write-Host ""

# Verificar si existe APK
$apkDebugPath = "android\app\build\outputs\apk\debug\app-debug.apk"
Write-Host "  APK Debug..." -NoNewline
if (Test-Path $apkDebugPath) {
    $apkSize = (Get-Item $apkDebugPath).Length / 1MB
    $apkDate = (Get-Item $apkDebugPath).LastWriteTime
    Write-Host " ✅" -ForegroundColor Green
    Write-Host "     Tamaño: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Gray
    Write-Host "     Fecha: $apkDate" -ForegroundColor Gray
} else {
    Write-Host " ⚠️ No compilada aún" -ForegroundColor Yellow
}

$apkReleasePath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
Write-Host "  APK Release..." -NoNewline
if (Test-Path $apkReleasePath) {
    $apkSize = (Get-Item $apkReleasePath).Length / 1MB
    $apkDate = (Get-Item $apkReleasePath).LastWriteTime
    Write-Host " ✅" -ForegroundColor Green
    Write-Host "     Tamaño: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Gray
    Write-Host "     Fecha: $apkDate" -ForegroundColor Gray
} else {
    Write-Host " ⚠️ No compilada" -ForegroundColor Yellow
}

# Resultado final
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "  ✅ CONFIGURACIÓN CORRECTA PARA XIAOMI REDMI" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Todo listo para compilar:" -ForegroundColor Cyan
    Write-Host "   npm run build:xiaomi" -ForegroundColor White
} else {
    Write-Host "  ⚠️ CONFIGURACIÓN INCOMPLETA" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Revisa los errores arriba y corrige los archivos faltantes" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📖 Para más información, consulta:" -ForegroundColor Cyan
Write-Host "   • XIAOMI_REDMI_CONFIG.md - Documentación técnica" -ForegroundColor White
Write-Host "   • XIAOMI_GUIA_RAPIDA.md - Guía de uso rápido" -ForegroundColor White
Write-Host ""
