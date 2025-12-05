# Setup scheduled task to automatically move backups from Downloads to OneDrive
# This script creates a Windows scheduled task that runs every hour

$scriptPath = "$PSScriptRoot\auto-move-backups.ps1"
$taskName = "Day2Day-AutoMoveBackups"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Scheduled task already exists. Updating..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the scheduled task action
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""

# Create trigger (runs every hour)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)

# Create task settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register the scheduled task
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Automatically moves Day2Day backup files from Downloads to OneDrive backups folder" | Out-Null

Write-Host "`nScheduled task created successfully!" -ForegroundColor Green
Write-Host "Task Name: $taskName" -ForegroundColor Cyan
Write-Host "Runs: Every hour" -ForegroundColor Cyan
Write-Host "`nThe task will automatically move backup files from Downloads to OneDrive every hour." -ForegroundColor Yellow
Write-Host "You can view/manage it in Task Scheduler (taskschd.msc)" -ForegroundColor Yellow









