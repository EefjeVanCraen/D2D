Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the script directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
htmlPath = scriptDir & "\index.html"
backupScript = scriptDir & "\backup-to-github.ps1"

' Open Day2Day in default browser
WshShell.Run "cmd /c start """" """ & htmlPath & """", 0, False

' Run silent GitHub backup in background
If fso.FileExists(backupScript) Then
    WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & backupScript & """ -Silent", 0, False
End If

Set WshShell = Nothing
Set fso = Nothing





















