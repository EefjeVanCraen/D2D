@echo off
REM Day2Day Platform - Launch in default browser
REM Also triggers a quick GitHub backup in the background
cd /d "%~dp0"
start "" "index.html"

REM Silent background backup (won't show any window)
start /min "" powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0backup-to-github.ps1" -Silent
exit





















