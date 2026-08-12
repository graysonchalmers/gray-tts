@echo off
REM Double-click to back up C:\Projects-local\Tool-GrayTTS to V:\Projects work\GrayTTS
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-graytts.ps1"
echo.
pause
