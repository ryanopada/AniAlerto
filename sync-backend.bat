@echo off
echo Syncing backend PHP files to XAMPP...
xcopy /s /y "D:\Download\ryan code\ANIALERTO\anialerto-backend\src\*" "C:\xampp\htdocs\anialerto-backend\src\"
echo.
echo Done! All PHP files synced to XAMPP.
pause
