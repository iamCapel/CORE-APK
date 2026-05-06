# Script para instalar APKs con correccion de notificaciones
# Detecta automaticamente el dispositivo y instala la APK correspondiente

Write-Host "Instalador de APKs MOPC Core - Notificaciones Corregidas" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Buscar ADB
$adbPath = $null
if (Test-Path "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe") {
    $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
} elseif (Test-Path "C:\Android\Sdk\platform-tools\adb.exe") {
    $adbPath = "C:\Android\Sdk\platform-tools\adb.exe"
} else {
    Write-Host "ERROR: ADB no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "OK: ADB encontrado" -ForegroundColor Green
Write-Host ""

# Verificar dispositivos conectados
Write-Host "Buscando dispositivos conectados..." -ForegroundColor Yellow
$devices = & $adbPath devices | Select-Object -Skip 1 | Where-Object { $_ -match '\t' }

if ($devices.Count -eq 0) {
    Write-Host "ERROR: No hay dispositivos conectados" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "  1. Conecta tu dispositivo Android via USB" -ForegroundColor White
    Write-Host "  2. Habilita Depuracion USB en Opciones de Desarrollador" -ForegroundColor White
    Write-Host "  3. Ejecuta este script nuevamente" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "OK: Dispositivos encontrados: $($devices.Count)" -ForegroundColor Green
Write-Host ""

# Procesar cada dispositivo
foreach ($device in $devices) {
    $deviceId = ($device -split '\t')[0]
    
    Write-Host "Dispositivo: $deviceId" -ForegroundColor Cyan
    
    # Obtener modelo del dispositivo
    $model = & $adbPath -s $deviceId shell getprop ro.product.model
    $brand = & $adbPath -s $deviceId shell getprop ro.product.brand
    
    Write-Host "   Marca: $brand" -ForegroundColor White
    Write-Host "   Modelo: $model" -ForegroundColor White
    
    # Determinar que APK instalar
    $apkFile = $null
    $flavorName = ""
    
    if ($model -like "*A04s*" -or $model -like "*SM-A047*") {
        $apkFile = "android\app\build\outputs\apk\a04s\debug\app-a04s-debug.apk"
        $flavorName = "Samsung Galaxy A04s"
    }
    elseif ($model -like "*Redmi*Note*12*" -or $model -like "*2211*") {
        $apkFile = "android\app\build\outputs\apk\note12\debug\app-note12-debug.apk"
        $flavorName = "Xiaomi Redmi Note 12"
    }
    elseif ($model -like "*TCL*20L*" -or $model -like "*T770H*") {
        $apkFile = "android\app\build\outputs\apk\tcl20l\debug\app-tcl20l-debug.apk"
        $flavorName = "TCL 20L Plus"
    }
    elseif ($model -like "*moto*g73*" -or $model -like "*XT2267*") {
        $apkFile = "android\app\build\outputs\apk\moto_g73\debug\app-moto_g73-debug.apk"
        $flavorName = "Motorola Moto G73 5G"
    }
    elseif ($model -like "*T1*Elite*" -or $brand -like "*Sunshine*") {
        $apkFile = "android\app\build\outputs\apk\sunshine_t1_elite\debug\app-sunshine_t1_elite-debug.apk"
        $flavorName = "Sunshine T1 Elite"
    }
    else {
        $apkFile = "android\app\build\outputs\apk\generic\debug\app-generic-debug.apk"
        $flavorName = "Generica"
    }
    
    Write-Host "   APK seleccionada: $flavorName" -ForegroundColor Yellow
    Write-Host ""
    
    # Verificar que el archivo existe
    if (-not (Test-Path $apkFile)) {
        Write-Host "   ERROR: APK no encontrada en $apkFile" -ForegroundColor Red
        Write-Host ""
        continue
    }
    
    $apkSize = (Get-Item $apkFile).Length / 1MB
    Write-Host "   Tamanio: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
    
    # Instalar APK
    Write-Host "   Instalando..." -ForegroundColor Yellow
    
    $installResult = & $adbPath -s $deviceId install -r $apkFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   INSTALACION EXITOSA" -ForegroundColor Green
        Write-Host ""
        Write-Host "   Cambios incluidos:" -ForegroundColor Cyan
        Write-Host "      - Canal de notificaciones de mensajes corregido" -ForegroundColor White
        Write-Host "      - Notificaciones de mensajes ahora aparecen" -ForegroundColor White
        Write-Host "      - Recordatorios siguen funcionando" -ForegroundColor White
    } else {
        Write-Host "   ERROR EN LA INSTALACION" -ForegroundColor Red
        Write-Host "   Detalles: $installResult" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "-----------------------------------------------------------" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nota: Las notificaciones funcionan correctamente ahora" -ForegroundColor Yellow
Write-Host ""
