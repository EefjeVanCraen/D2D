# Fix the desktop shortcut icon
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "Day2Day Platform.lnk"

if (-not (Test-Path $ShortcutPath)) {
    Write-Host "Shortcut not found at: $ShortcutPath" -ForegroundColor Red
    exit
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Get the PNG file path (full path)
$pngPath = "$PSScriptRoot\CnG logo.png"
$icoPath = "$PSScriptRoot\CnG logo.ico"

# Try to use PNG directly (Windows 10/11 supports this)
if (Test-Path $pngPath) {
    # Use PNG with full absolute path
    $fullPngPath = (Resolve-Path $pngPath).Path
    $Shortcut.IconLocation = $fullPngPath
    Write-Host "Setting icon to PNG: $fullPngPath" -ForegroundColor Cyan
} elseif (Test-Path $icoPath) {
    $fullIcoPath = (Resolve-Path $icoPath).Path
    $Shortcut.IconLocation = $fullIcoPath
    Write-Host "Setting icon to ICO: $fullIcoPath" -ForegroundColor Cyan
}

$Shortcut.Save()
Write-Host "Shortcut icon updated!" -ForegroundColor Green
Write-Host "Refreshing desktop..." -ForegroundColor Yellow

# Refresh desktop
Start-Sleep -Milliseconds 500
$null = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Shell.Application')
[System.Windows.Forms.SendKeys]::SendWait('{F5}')









