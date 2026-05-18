@echo off
echo ============================================================
echo   AniAlerto Scheduler — MANUAL / EMERGENCY TRIGGER
echo ============================================================
echo.
echo  NOTE: The SMS Worker (index.js) runs the scheduler
echo  automatically every 60 seconds. You do NOT need to
echo  run this script during normal operation.
echo.
echo  Use this only if the worker is stopped and you need to
echo  force-queue overdue messages immediately.
echo ============================================================
echo.
curl -s "http://localhost/anialerto-backend/src/run_scheduler.php"
echo.
echo Scheduler manually triggered at %date% %time%
pause
