# Final fix for shortcut icon
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "Day2Day Platform.lnk"

if (-not (Test-Path $ShortcutPath)) {
    Write-Host "Shortcut not found!" -ForegroundColor Red
    exit
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Get absolute path to PNG
$pngPath = (Resolve-Path "$PSScriptRoot\CnG logo.png").Path

# Set icon - try without index first, then with index 0
$Shortcut.IconLocation = $pngPath
$Shortcut.Save()

Write-Host "Icon set to: $pngPath" -ForegroundColor Green
Write-Host "`nIf the icon still doesn't appear, Windows may need the icon set manually:" -ForegroundColor Yellow
Write-Host "1. Right-click the shortcut on desktop" -ForegroundColor Cyan
Write-Host "2. Select 'Properties'" -ForegroundColor Cyan
Write-Host "3. Click 'Change Icon...'" -ForegroundColor Cyan
Write-Host "4. Click 'Browse...' and navigate to:" -ForegroundColor Cyan
Write-Host "   $pngPath" -ForegroundColor White
Write-Host "5. Select the PNG file and click OK" -ForegroundColor Cyan

# Force refresh
Start-Sleep -Milliseconds 500
ie4uinit.exe -show | Out-Null









