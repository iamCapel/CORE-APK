# sync-from-core.ps1
# Sincroniza los archivos compartidos de la plataforma web (core) hacia CORE-APK
# Uso: .\sync-from-core.ps1 [-Push]

param(
    [switch]$Push  # Si se pasa -Push, hace commit + push automático
)

$CORE = "C:\Users\migue\core"
$APK  = "C:\Users\migue\StudioProjects\CORE-APK"

$files = @(
    # Componentes de chat y usuarios
    @{ src = "src\components\ChatList.tsx";          dst = "src\components\ChatList.tsx" },
    @{ src = "src\components\ChatList.css";          dst = "src\components\ChatList.css" },
    @{ src = "src\components\ChatModal.tsx";         dst = "src\components\ChatModal.tsx" },
    @{ src = "src\components\ChatModal.css";         dst = "src\components\ChatModal.css" },
    @{ src = "src\components\ClickableUsername.tsx"; dst = "src\components\ClickableUsername.tsx" },
    @{ src = "src\components\UserModal.tsx";         dst = "src\components\UserModal.tsx" },
    @{ src = "src\components\UserModal.css";         dst = "src\components\UserModal.css" },

    # Servicios
    @{ src = "src\services\chatService.ts";          dst = "src\services\chatService.ts" },
    @{ src = "src\services\userPresenceService.ts";  dst = "src\services\userPresenceService.ts" },
    @{ src = "src\services\userLocationService.ts";  dst = "src\services\userLocationService.ts" }
)

$changed = @()

foreach ($f in $files) {
    $srcPath = Join-Path $CORE $f.src
    $dstPath = Join-Path $APK  $f.dst

    if (-not (Test-Path $srcPath)) {
        Write-Host "  SKIP (no existe en core): $($f.src)" -ForegroundColor Yellow
        continue
    }

    $srcHash = (Get-FileHash $srcPath -Algorithm MD5).Hash
    $dstHash = if (Test-Path $dstPath) { (Get-FileHash $dstPath -Algorithm MD5).Hash } else { "" }

    if ($srcHash -ne $dstHash) {
        Copy-Item $srcPath $dstPath -Force
        Write-Host "  UPDATED: $($f.dst)" -ForegroundColor Green
        $changed += $f.dst
    } else {
        Write-Host "  OK (sin cambios): $($f.dst)" -ForegroundColor DarkGray
    }
}

if ($changed.Count -eq 0) {
    Write-Host "`nTodo sincronizado, sin cambios." -ForegroundColor Cyan
    exit 0
}

Write-Host "`n$($changed.Count) archivo(s) actualizado(s)." -ForegroundColor Cyan

if ($Push) {
    Set-Location $APK
    git add ($changed | ForEach-Object { $_ })
    $msg = "sync: actualizar archivos compartidos desde core`n`n" + ($changed -join "`n")
    git commit -m $msg
    git push origin main
    Write-Host "`nPush completado." -ForegroundColor Green
} else {
    Write-Host "Ejecuta con -Push para hacer commit+push automatico." -ForegroundColor Yellow
}
