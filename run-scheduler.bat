@echo off
echo Running AniAlerto Scheduler...
curl -s "http://localhost/anialerto-backend/src/run_scheduler.php"
echo.
echo Scheduler triggered at %date% %time%
