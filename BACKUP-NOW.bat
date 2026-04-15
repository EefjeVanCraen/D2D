@echo off
REM Day2Day Platform - Quick GitHub Backup
REM Double-click this to commit and push all changes to GitHub
cd /d "%~dp0"
echo.
echo === Day2Day GitHub Backup ===
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0backup-to-github.ps1"
echo.
pause
