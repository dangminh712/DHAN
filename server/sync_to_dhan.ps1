$src = Split-Path -Parent $PSScriptRoot
$dst = 'C:\Users\DangMinh\Documents\GitHub\DHAN'

Write-Host "Source: $src"
Write-Host "Dest:   $dst"

Copy-Item -Recurse -Force "$src\client\src\components" "$dst\client\src\"
Copy-Item -Recurse -Force "$src\client\src\pages" "$dst\client\src\"
Copy-Item -Recurse -Force "$src\client\src\context" "$dst\client\src\"
Copy-Item -Recurse -Force "$src\client\src\services" "$dst\client\src\"
Copy-Item -Force "$src\client\src\App.jsx" "$dst\client\src\App.jsx"

Copy-Item -Recurse -Force "$src\server\Controllers" "$dst\server\"
Copy-Item -Recurse -Force "$src\server\Services" "$dst\server\"
Copy-Item -Recurse -Force "$src\server\DTOs" "$dst\server\"
Copy-Item -Recurse -Force "$src\server\Data" "$dst\server\"
Copy-Item -Recurse -Force "$src\server\Models" "$dst\server\"
Copy-Item -Force "$src\server\Program.cs" "$dst\server\Program.cs"
Copy-Item -Force "$src\server\appsettings.json" "$dst\server\appsettings.json"

Remove-Item "$dst\server\Controllers\TrainingControllers.cs" -Force -ErrorAction SilentlyContinue
Remove-Item "$dst\server\Services\SecurityServices.cs" -Force -ErrorAction SilentlyContinue

Write-Host "SUCCESS: Synchronized all files to Documents/GitHub/DHAN"
