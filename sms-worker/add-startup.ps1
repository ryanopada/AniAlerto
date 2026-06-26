$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\AniAlertoWorker.lnk")
$Shortcut.TargetPath = "D:\Download\ryan code\ANIALERTO\sms-worker\start-worker.bat"
$Shortcut.WorkingDirectory = "D:\Download\ryan code\ANIALERTO\sms-worker"
$Shortcut.Save()
