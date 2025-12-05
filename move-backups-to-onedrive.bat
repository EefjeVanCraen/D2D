@echo off
REM Simple batch file to move backup files from Downloads to OneDrive backups folder
REM Run this manually or set it up to run automatically

set "DOWNLOADS=%USERPROFILE%\Downloads"
set "BACKUPS=%~dp0backups"

echo Moving Day2Day backup files to OneDrive...
echo.

if not exist "%BACKUPS%" (
    mkdir "%BACKUPS%"
    echo Created backups folder
)

for %%f in ("%DOWNLOADS%\day2day-backup-*.json") do (
    if exist "%%f" (
        move /Y "%%f" "%BACKUPS%\" >nul
        echo Moved: %%~nxf
    )
)

echo.
echo Done! Backup files are now in OneDrive and will sync to cloud.
pause









