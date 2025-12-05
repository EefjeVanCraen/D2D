# Fix icon by creating a proper ICO file
Add-Type -AssemblyName System.Drawing

$pngPath = "$PSScriptRoot\CnG logo.png"
$icoPath = "$PSScriptRoot\CnG logo.ico"

if (-not (Test-Path $pngPath)) {
    Write-Host "PNG file not found!" -ForegroundColor Red
    exit
}

try {
    # Load PNG
    $img = [System.Drawing.Image]::FromFile($pngPath)
    
    # Create bitmap
    $bmp = New-Object System.Drawing.Bitmap($img)
    
    # Create icon (this method should work)
    $icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
    
    # Save ICO
    $fs = [System.IO.File]::Create($icoPath)
    $icon.Save($fs)
    $fs.Close()
    
    # Cleanup
    $icon.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    
    $size = (Get-Item $icoPath).Length
    Write-Host "ICO file created: $icoPath ($size bytes)" -ForegroundColor Green
    
    # Now update the shortcut
    $DesktopPath = [Environment]::GetFolderPath('Desktop')
    $ShortcutPath = Join-Path $DesktopPath "Day2Day Platform.lnk"
    
    if (Test-Path $ShortcutPath) {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.IconLocation = $icoPath
        $Shortcut.Save()
        Write-Host "Shortcut icon updated!" -ForegroundColor Green
        Write-Host "Note: You may need to refresh the desktop (F5) or restart Explorer to see the icon change." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`nAlternative: Right-click the shortcut > Properties > Change Icon > Browse to: $pngPath" -ForegroundColor Yellow
}









