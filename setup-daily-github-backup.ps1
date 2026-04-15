# Day2Day Platform - Setup Daily Automatic GitHub Backup
# This creates a Windows Task Scheduler task that runs the backup daily at 6 PM
# Run this script ONCE as Administrator to set up the scheduled task

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupScript = Join-Path $scriptDir "backup-to-github.ps1"

# Task settings
$taskName = "Day2Day-GitHubBackup"
$description = "Automatically commits and pushes Day2Day Platform changes to GitHub daily"
$triggerTime = "18:00" # 6 PM

Write-Host ""
Write-Host "=== Day2Day Daily GitHub Backup Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Task '$taskName' already exists. Removing old task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the scheduled task
try {
    $action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$backupScript`" -Silent" `
        -WorkingDirectory $scriptDir

    $trigger = New-ScheduledTaskTrigger -Daily -At $triggerTime

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable

    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Limited

    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description $description | Out-Null

    Write-Host "SUCCESS! Daily backup task created." -ForegroundColor Green
    Write-Host ""
    Write-Host "Details:" -ForegroundColor White
    Write-Host "  Task Name:  $taskName" -ForegroundColor Gray
    Write-Host "  Schedule:   Every day at $triggerTime" -ForegroundColor Gray
    Write-Host "  Script:     $backupScript" -ForegroundColor Gray
    Write-Host "  Repository: https://github.com/EefjeVanCraen/D2D" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To test it now, run: BACKUP-NOW.bat" -ForegroundColor Yellow
    Write-Host "To remove the task: Unregister-ScheduledTask -TaskName '$taskName'" -ForegroundColor DarkGray
} catch {
    Write-Host "ERROR creating scheduled task:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "You may need to run this script as Administrator." -ForegroundColor Yellow
    Write-Host "Right-click PowerShell > 'Run as Administrator'" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to close"
