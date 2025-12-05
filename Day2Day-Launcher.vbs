Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get the script directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
htmlPath = scriptDir & "\index.html"

' Open in default browser
WshShell.Run "cmd /c start """" """ & htmlPath & """", 0, False

Set WshShell = Nothing
Set fso = Nothing









