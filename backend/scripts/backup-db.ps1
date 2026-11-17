<#
  Respaldo automático de la base de datos Banquito Solidario.
  Lee la conexión desde backend/.env (DATABASE_URL) y genera un dump con timestamp.

  Uso:
    pwsh scripts/backup-db.ps1            # backup en ./backups
    pwsh scripts/backup-db.ps1 -Keep 14   # conserva solo los últimos 14 respaldos

  Para automatizarlo con el Programador de tareas de Windows:
    schtasks /Create /TN "Banquito Backup" /SC DAILY /ST 02:00 `
      /TR "powershell -NoProfile -ExecutionPolicy Bypass -File D:\BancoComunal\backend\scripts\backup-db.ps1"
#>
param(
  [int]$Keep = 14
)

$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$archivoEnv = Join-Path $raiz 'backend\.env'
if (-not (Test-Path $archivoEnv)) {
  throw "No se encontró el archivo de entorno: $archivoEnv"
}

$lineaUrl = (Get-Content $archivoEnv | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1)
if (-not $lineaUrl) {
  throw 'No se encontró DATABASE_URL en backend/.env'
}
$url = ($lineaUrl -split '=', 2)[1].Trim('"').Trim("'")

# Formato: mysql://usuario:password@host:puerto/base?parametros
if ($url -notmatch '^mysql://([^:]+):([^@]+)@([^/]+)/([^?]+)') {
  throw 'DATABASE_URL no tiene el formato esperado (mysql://usuario:password@host:puerto/base)'
}

$usuario   = [uri]::UnescapeDataString($Matches[1])
$password  = [uri]::UnescapeDataString($Matches[2])
$servidor  = $Matches[3]
$base      = $Matches[4]

$mysqldump = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe'
if (-not (Test-Path $mysqldump)) {
  $mysqldump = (Get-Command mysqldump -ErrorAction SilentlyContinue).Source
}
if (-not $mysqldump) {
  throw 'No se encontró mysqldump.exe. Ajusta la ruta en el script.'
}

$carpetaBackups = Join-Path $raiz 'backups'
New-Item -ItemType Directory -Force -Path $carpetaBackups | Out-Null

$marca = Get-Date -Format 'yyyyMMdd_HHmmss'
$destino = Join-Path $carpetaBackups "banquito_solidario_$marca.sql"

& $mysqldump `
  --user=$usuario `
  "--password=$password" `
  --host=$servidor.Split(':')[0] `
  --port=($servidor.Split(':')[1] ?? '3306') `
  --single-transaction `
  --default-character-set=utf8mb4 `
  --routines `
  --triggers `
  $base 2>$null | Out-File -Encoding utf8 $destino

if ($LASTEXITCODE -ne 0) {
  Remove-Item $destino -ErrorAction SilentlyContinue
  throw "mysqldump falló con código $LASTEXITCODE"
}

Write-Host "Respaldo creado: $destino ($((Get-Item $destino).Length) bytes)"

# Poda de respaldos antiguos
$respaldos = Get-ChildItem $carpetaBackups -Filter 'banquito_solidario_*.sql' |
  Sort-Object LastWriteTime -Descending
if ($respaldos.Count -gt $Keep) {
  $respaldos | Select-Object -Skip $Keep | ForEach-Object {
    Remove-Item $_.FullName
    Write-Host "Eliminado respaldo antiguo: $($_.Name)"
  }
}
