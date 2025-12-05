# Convert PNG to ICO using .NET
Add-Type -AssemblyName System.Drawing

$pngPath = "$PSScriptRoot\CnG logo.png"
$icoPath = "$PSScriptRoot\CnG logo.ico"

if (Test-Path $pngPath) {
    try {
        $png = [System.Drawing.Image]::FromFile($pngPath)
        $bitmap = New-Object System.Drawing.Bitmap($png)
        
        # Create ICO file
        $stream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
        $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
        $icon.Save($stream)
        $stream.Close()
        
        $png.Dispose()
        $bitmap.Dispose()
        $icon.Dispose()
        
        Write-Host "Successfully converted PNG to ICO: $icoPath" -ForegroundColor Green
    } catch {
        Write-Host "Error converting PNG to ICO: $_" -ForegroundColor Red
        # Fallback: Copy PNG and rename (Windows might still use it)
        Copy-Item $pngPath $icoPath -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "PNG file not found: $pngPath" -ForegroundColor Red
}









