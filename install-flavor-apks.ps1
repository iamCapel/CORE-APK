# Install built APKs for each flavor (Samsung, TCL, Xiaomi)
# Run from repository root: .\install-flavor-apks.ps1

$releaseDir = "android\app\build\outputs\apk\release"
if (-not (Test-Path $releaseDir)) {
    Write-Error "Release APK folder not found: $releaseDir"
    return
}

$apkFiles = @(
    "app-a04s-release.apk",      # Samsung Galaxy A04s
    "app-note12-release.apk",    # Xiaomi Redmi Note 12
    "app-tcl20l-release.apk",    # TCL 20L Plus
    "app-generic-release.apk"    # Genérico 
)

# Ensure adb executable available
$adb = "adb"
if (-not (Get-Command $adb -ErrorAction SilentlyContinue)) {
    Write-Error "adb no está disponible en PATH. Instale Android SDK Platform-Tools y agregue adb a la variable de entorno PATH."
    return
}

Write-Host "Desinstalando paquete actual (com.mopc.core)..."
& $adb uninstall com.mopc.core | Write-Host

foreach ($apk in $apkFiles) {
    $path = Join-Path $releaseDir $apk
    if (Test-Path $path) {
        Write-Host "Instalando $apk..."
        & $adb install -r $path | Write-Host
    } else {
        Write-Warning "APK no encontrado, omito: $apk"
    }
}

Write-Host "Instalación finalizada. Verifique en el dispositivo."