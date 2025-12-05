# Create ICO file with blue background instead of green
Add-Type -AssemblyName System.Drawing

$pngPath = "$PSScriptRoot\CnG logo.png"
$icoPath = "$PSScriptRoot\CnG logo.ico"

if (-not (Test-Path $pngPath)) {
    Write-Host "PNG file not found: $pngPath" -ForegroundColor Red
    exit
}

Write-Host "Creating ICO file with blue background..." -ForegroundColor Cyan

try {
    # Load the original PNG image
    $originalImage = [System.Drawing.Image]::FromFile($pngPath)
    Write-Host "Original image size: $($originalImage.Width)x$($originalImage.Height)" -ForegroundColor Gray
    
    # Create a new bitmap with blue background
    $targetSize = 256
    $bitmap = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Set high quality rendering
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Fill with blue background (using the CSS primary color from the app: #4a90e2 = RGB 74, 144, 226)
    $blueColor = [System.Drawing.Color]::FromArgb(74, 144, 226)
    $graphics.Clear($blueColor)
    
    # Draw the original image centered and scaled
    $graphics.DrawImage($originalImage, 0, 0, $targetSize, $targetSize)
    
    # Create icon from bitmap
    $iconHandle = $bitmap.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    
    # Save ICO file
    $fileStream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
    $icon.Save($fileStream)
    $fileStream.Close()
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $icon.Dispose()
    $originalImage.Dispose()
    
    # Verify the file was created
    if (Test-Path $icoPath) {
        $fileSize = (Get-Item $icoPath).Length
        Write-Host "`nICO file created successfully with blue background!" -ForegroundColor Green
        Write-Host "Location: $icoPath" -ForegroundColor Cyan
        Write-Host "Size: $fileSize bytes" -ForegroundColor Cyan
        Write-Host "Background color: Blue (RGB: 74, 144, 226)" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to create ICO file" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error creating ICO: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
}









