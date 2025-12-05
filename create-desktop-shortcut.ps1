# PowerShell script to create desktop shortcut for Day2Day Platform
$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $DesktopPath "Day2Day Platform.lnk"

# Ensure Desktop directory exists
if (-not (Test-Path $DesktopPath)) {
    New-Item -ItemType Directory -Path $DesktopPath -Force | Out-Null
}

# Use VBScript launcher for better icon support
$launcherPath = "$PSScriptRoot\Day2Day-Launcher.vbs"
$icoPath = "$PSScriptRoot\CnG logo.ico"
$pngPath = "$PSScriptRoot\CnG logo.png"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$launcherPath`""
$Shortcut.WorkingDirectory = $PSScriptRoot

# Try to use ICO, fallback to PNG, or use default
if ((Test-Path $icoPath) -and ((Get-Item $icoPath).Length -gt 1000)) {
    $Shortcut.IconLocation = $icoPath
    Write-Host "Using ICO icon file" -ForegroundColor Cyan
} elseif (Test-Path $pngPath) {
    # For PNG, we need to extract icon using a different method
    # Try using the PNG with full path
    $Shortcut.IconLocation = "$pngPath,0"
    Write-Host "Using PNG icon file (may require icon refresh)" -ForegroundColor Yellow
} else {
    Write-Host "Icon file not found, using default" -ForegroundColor Yellow
}

$Shortcut.Description = "Day2Day Platform - Daily Task and Idea Management"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host "Double-click the shortcut on your desktop to launch Day2Day Platform" -ForegroundColor Yellow

