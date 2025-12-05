# Create proper ICO file from PNG logo
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$pngPath = "$PSScriptRoot\CnG logo.png"
$icoPath = "$PSScriptRoot\CnG logo.ico"

if (-not (Test-Path $pngPath)) {
    Write-Host "PNG file not found: $pngPath" -ForegroundColor Red
    exit
}

Write-Host "Creating ICO file from PNG..." -ForegroundColor Cyan

try {
    # Load the original PNG image
    $originalImage = [System.Drawing.Image]::FromFile($pngPath)
    Write-Host "Original image size: $($originalImage.Width)x$($originalImage.Height)" -ForegroundColor Gray
    
    # Create ICO with multiple sizes (16x16, 32x32, 48x48, 256x256)
    $sizes = @(16, 32, 48, 256)
    $images = New-Object System.Collections.ArrayList
    
    foreach ($size in $sizes) {
        # Resize image maintaining aspect ratio
        $newWidth = $size
        $newHeight = $size
        if ($originalImage.Width -gt $originalImage.Height) {
            $newHeight = [int]($size * $originalImage.Height / $originalImage.Width)
        } else {
            $newWidth = [int]($size * $originalImage.Width / $originalImage.Height)
        }
        
        $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.DrawImage($originalImage, 0, 0, $newWidth, $newHeight)
        
        $images.Add($bitmap) | Out-Null
        $graphics.Dispose()
    }
    
    # Create ICO file using the largest bitmap (256x256)
    $largestBitmap = $images[$images.Count - 1]
    $iconHandle = $largestBitmap.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    
    # Save ICO file
    $fileStream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
    $icon.Save($fileStream)
    $fileStream.Close()
    
    # Cleanup
    foreach ($img in $images) {
        $img.Dispose()
    }
    $icon.Dispose()
    $originalImage.Dispose()
    
    # Verify the file was created
    if (Test-Path $icoPath) {
        $fileSize = (Get-Item $icoPath).Length
        Write-Host "`nICO file created successfully!" -ForegroundColor Green
        Write-Host "Location: $icoPath" -ForegroundColor Cyan
        Write-Host "Size: $fileSize bytes" -ForegroundColor Cyan
        
        if ($fileSize -lt 1000) {
            Write-Host "`nWarning: ICO file seems small. Trying alternative method..." -ForegroundColor Yellow
            # Try alternative: Copy PNG and rename (some systems accept this)
            Copy-Item $pngPath $icoPath -Force
            Write-Host "Created ICO file (PNG copy) as fallback" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Failed to create ICO file" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error creating ICO: $_" -ForegroundColor Red
    Write-Host "`nTrying fallback method..." -ForegroundColor Yellow
    
    # Fallback: Use ImageMagick if available, or create a simple ICO
    try {
        # Try to use the PNG directly as ICO (some Windows versions accept this)
        Copy-Item $pngPath $icoPath -Force
        Write-Host "Created ICO file using PNG as fallback" -ForegroundColor Yellow
    } catch {
        Write-Host "All methods failed. Please use an online converter:" -ForegroundColor Red
        Write-Host "https://convertio.co/png-ico/" -ForegroundColor Cyan
    }
}









