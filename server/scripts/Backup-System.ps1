param(
  [Parameter(Mandatory=$true)][string]$Destination,
  [Parameter(Mandatory=$true)][string]$MySqlBin,
  [string]$ServerRoot = (Split-Path $PSScriptRoot -Parent)
)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($ServerRoot)
$target = [IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $target) { throw 'Backup destination must not already exist.' }
if ($target.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Store backups outside the server directory.' }
$config = Get-Content -Raw -LiteralPath (Join-Path $root 'appsettings.json') | ConvertFrom-Json
$parts = @{}
foreach ($entry in $config.ConnectionStrings.DefaultConnection.Split(';')) {
  if ($entry.Contains('=')) { $key,$value = $entry.Split('=',2); $parts[$key] = $value }
}
New-Item -ItemType Directory -Path $target | Out-Null
$oldPassword = $env:MYSQL_PWD
try {
  $env:MYSQL_PWD = $parts['Password']
  $dumpPath = Join-Path $target 'database.sql'
  & (Join-Path $MySqlBin 'mysqldump.exe') --host=$($parts['Server']) --port=$($parts['Port']) --user=$($parts['User']) --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF "--result-file=$dumpPath" $parts['Database']
  if ($LASTEXITCODE -ne 0) { throw 'MySQL dump failed; this backup is incomplete.' }
  Copy-Item -LiteralPath (Join-Path $root 'Storage') -Destination (Join-Path $target 'Storage') -Recurse
  Write-Output "Backup complete: $target (database.sql + Storage). Stop uploads/deletes during backup for a consistent file/DB snapshot."
} finally { $env:MYSQL_PWD = $oldPassword }
