# PowerShell script to create taskbar shortcut for Day2Day Platform
# Note: This creates a shortcut that can be pinned to taskbar

$WshShell = New-Object -ComObject WScript.Shell
$ShortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Day2Day Platform.lnk"

# Use VBScript launcher for better compatibility with taskbar pinning
$launcherPath = "$PSScriptRoot\Day2Day-Launcher.vbs"
$icoPath = "$PSScriptRoot\CnG logo.ico"
$pngPath = "$PSScriptRoot\CnG logo.png"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$launcherPath`""
$Shortcut.WorkingDirectory = $PSScriptRoot

# Use ICO file with blue background
if (Test-Path $icoPath) {
    $fullIcoPath = (Resolve-Path $icoPath).Path
    $Shortcut.IconLocation = $fullIcoPath
    Write-Host "Using ICO icon file" -ForegroundColor Cyan
} elseif (Test-Path $pngPath) {
    $fullPngPath = (Resolve-Path $pngPath).Path
    $Shortcut.IconLocation = $fullPngPath
    Write-Host "Using PNG icon file" -ForegroundColor Yellow
}

$Shortcut.Description = "Day2Day Platform - Daily Task and Idea Management"
$Shortcut.Save()

Write-Host "`nShortcut created in Start Menu!" -ForegroundColor Green
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host "`nTo pin to taskbar:" -ForegroundColor Yellow
Write-Host "1. Press Windows key and search for 'Day2Day Platform'" -ForegroundColor Cyan
Write-Host "2. Right-click the result and select 'Pin to taskbar'" -ForegroundColor Cyan
Write-Host "   OR drag it from Start Menu directly to the taskbar" -ForegroundColor Cyan
Write-Host "`nAlternatively, you can:" -ForegroundColor Yellow
Write-Host "- Right-click the desktop shortcut and select 'Pin to taskbar'" -ForegroundColor Cyan

