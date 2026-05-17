@echo off
echo ==========================================
echo   AniAlerto System Startup
echo ==========================================

echo [1/3] Starting XAMPP MySQL...
"C:\xampp\mysql\bin\mysqld.exe" --standalone &
timeout /t 3 /nobreak > nul

echo [2/3] Starting XAMPP Apache...
"C:\xampp\apache\bin\httpd.exe" &
timeout /t 2 /nobreak > nul

echo [3/3] Starting SMS Worker...
cd /d "D:\Download\ryan code\ANIALERTO\sms-worker"
pm2 start "D:\Download\ryan code\ANIALERTO\sms-worker\index.js" --name anialerto-worker 2>nul
pm2 restart anialerto-worker 2>nul
pm2 save

echo.
echo ==========================================
echo   AniAlerto is running!
echo   Open: http://localhost:5173
echo   Run npm run dev in ANIALERTO folder
echo ==========================================
pause
