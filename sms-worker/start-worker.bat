@echo off
title AniAlerto SMS Worker
cd /d "%~dp0"
:loop
echo =========================================
echo    Starting AniAlerto Worker...
echo =========================================
node index.js
echo.
echo Worker stopped. Restarting in 5 seconds...
timeout /t 5
goto loop
