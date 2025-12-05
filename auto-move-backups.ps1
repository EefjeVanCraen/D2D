# PowerShell script to automatically move backup files from Downloads to OneDrive backups folder
# Run this script periodically or set it up as a scheduled task

$downloadsPath = "$env:USERPROFILE\Downloads"
$backupsPath = "$PSScriptRoot\backups"

# Create backups folder if it doesn't exist
if (-not (Test-Path $backupsPath)) {
    New-Item -ItemType Directory -Path $backupsPath -Force | Out-Null
    Write-Host "Created backups folder: $backupsPath" -ForegroundColor Green
}

# Find all Day2Day backup files in Downloads
$backupFiles = Get-ChildItem -Path $downloadsPath -Filter "day2day-backup-*.json" -ErrorAction SilentlyContinue

if ($backupFiles.Count -eq 0) {
    Write-Host "No backup files found in Downloads folder." -ForegroundColor Yellow
    exit
}

Write-Host "Found $($backupFiles.Count) backup file(s) to move..." -ForegroundColor Cyan

foreach ($file in $backupFiles) {
    $destination = Join-Path $backupsPath $file.Name
    
    # Check if file already exists in backups folder
    if (Test-Path $destination) {
        # Compare file sizes/dates to decide if we should overwrite
        $existingFile = Get-Item $destination
        if ($file.LastWriteTime -gt $existingFile.LastWriteTime) {
            Move-Item -Path $file.FullName -Destination $destination -Force
            Write-Host "Updated: $($file.Name)" -ForegroundColor Green
        } else {
            Remove-Item -Path $file.FullName -Force
            Write-Host "Skipped (already exists): $($file.Name)" -ForegroundColor Yellow
        }
    } else {
        Move-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "Moved: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`nBackup files moved to OneDrive folder: $backupsPath" -ForegroundColor Green
Write-Host "Files will automatically sync to OneDrive cloud." -ForegroundColor Cyan









