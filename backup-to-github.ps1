# Day2Day Platform - Daily GitHub Backup Script
# Run this manually or schedule it via Task Scheduler
# It commits all changes and pushes to the D2D GitHub repo

param(
    [switch]$Silent,
    [string]$Message = ""
)

$ErrorActionPreference = "Continue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $scriptDir

# Check if we're in a git repo
if (-not (Test-Path ".git")) {
    if (-not $Silent) {
        Write-Host "ERROR: Not a git repository. Run 'git init' first." -ForegroundColor Red
    }
    exit 1
}

# Check if there are any changes
$status = git status --porcelain 2>&1
if ([string]::IsNullOrWhiteSpace($status)) {
    if (-not $Silent) {
        Write-Host "No changes to commit. Everything is up to date." -ForegroundColor Green
    }
    exit 0
}

# Build commit message
$date = Get-Date -Format "yyyy-MM-dd HH:mm"
if ([string]::IsNullOrWhiteSpace($Message)) {
    $commitMessage = "Auto-backup: $date"
} else {
    $commitMessage = "$Message ($date)"
}

# Stage all tracked + new files (respecting .gitignore)
git add -A 2>&1 | Out-Null

# Commit
$commitResult = git commit -m $commitMessage 2>&1
if ($LASTEXITCODE -ne 0) {
    if (-not $Silent) {
        Write-Host "Commit failed:" -ForegroundColor Red
        Write-Host $commitResult
    }
    exit 1
}

if (-not $Silent) {
    Write-Host "Committed: $commitMessage" -ForegroundColor Cyan
}

# Push to origin
$pushResult = git push origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    if (-not $Silent) {
        Write-Host "Push failed (you may need to authenticate):" -ForegroundColor Yellow
        Write-Host $pushResult
        Write-Host ""
        Write-Host "To fix: open a terminal in this folder and run:" -ForegroundColor Yellow
        Write-Host "  git push origin main" -ForegroundColor White
    }
    exit 1
}

if (-not $Silent) {
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/EefjeVanCraen/D2D" -ForegroundColor DarkGray
}

exit 0
