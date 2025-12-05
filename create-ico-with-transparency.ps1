# Create ICO file with proper transparency and blue background
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Drawing.Imaging

$pngPath = "$PSScriptRoot\CnG logo.png"
$icoPath = "$PSScriptRoot\CnG logo.ico"

if (-not (Test-Path $pngPath)) {
    Write-Host "PNG file not found: $pngPath" -ForegroundColor Red
    exit
}

Write-Host "Creating ICO file with proper color handling..." -ForegroundColor Cyan

try {
    # Load the original PNG image
    $originalImage = [System.Drawing.Image]::FromFile($pngPath)
    Write-Host "Original image size: $($originalImage.Width)x$($originalImage.Height)" -ForegroundColor Gray
    
    # Create a new bitmap with proper format for ICO
    $targetSize = 256
    $bitmap = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Set high quality rendering
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill with blue background if needed, or use transparent
    # Check if image has transparency
    if ($originalImage.PixelFormat -eq [System.Drawing.Imaging.PixelFormat]::Format32bppArgb) {
        # Image has alpha channel - preserve transparency
        $graphics.Clear([System.Drawing.Color]::Transparent)
    } else {
        # Fill with blue background (RGB: 0, 120, 215 - Windows blue, or use a lighter blue)
        $blueColor = [System.Drawing.Color]::FromArgb(74, 144, 226) # Similar to the CSS primary color
        $graphics.Clear($blueColor)
    }
    
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
        Write-Host "`nICO file created successfully!" -ForegroundColor Green
        Write-Host "Location: $icoPath" -ForegroundColor Cyan
        Write-Host "Size: $fileSize bytes" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to create ICO file" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error creating ICO: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}









