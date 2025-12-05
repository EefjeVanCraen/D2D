# Create proper ICO file from PNG
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$pngPath = "$PSScriptRoot\CnG logo.png"
$icoPath = "$PSScriptRoot\CnG logo.ico"

if (-not (Test-Path $pngPath)) {
    Write-Host "PNG file not found: $pngPath" -ForegroundColor Red
    exit
}

try {
    # Load the PNG image
    $image = [System.Drawing.Image]::FromFile($pngPath)
    
    # Create a bitmap from the image
    $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
    
    # Get the icon handle
    $iconHandle = $bitmap.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    
    # Save as ICO
    $fileStream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
    $icon.Save($fileStream)
    $fileStream.Close()
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $icon.Dispose()
    $image.Dispose()
    [System.Runtime.InteropServices.Marshal]::DestroyIcon($iconHandle)
    
    Write-Host "Successfully created ICO file: $icoPath" -ForegroundColor Green
    Write-Host "File size: $((Get-Item $icoPath).Length) bytes" -ForegroundColor Cyan
} catch {
    Write-Host "Error creating ICO: $_" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Use ImageMagick if available, or create a simple workaround
    # For now, we'll use the PNG directly in the shortcut (some Windows versions support this)
}









