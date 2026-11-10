# Build de produccion + ZIP de despliegue para DirectAdmin / cPanel (Setup Node.js App)
# Uso: powershell -ExecutionPolicy Bypass -File scripts\build-deploy.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '==> 1/4 Build del frontend (Vite)...' -ForegroundColor Cyan
npm run build -w frontend
if ($LASTEXITCODE -ne 0) { throw 'Fallo el build del frontend' }

Write-Host '==> 2/4 Build del backend (tsc)...' -ForegroundColor Cyan
npm run build -w backend
if ($LASTEXITCODE -ne 0) { throw 'Fallo el build del backend' }

Write-Host '==> 3/4 Preparando deploy/stage...' -ForegroundColor Cyan
$stage = Join-Path $root 'deploy\stage'
$zip = Join-Path $root 'deploy\banquito-deploy.zip'
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item (Join-Path $root 'backend\package.json') $stage
Copy-Item (Join-Path $root 'backend\package-lock.json') $stage

# postinstall: resolver el schema con INIT_CWD (DirectAdmin ejecuta npm en el nodevenv, no en el app root)
# Se escribe UTF8 SIN BOM: prisma generate hace JSON.parse estricto de package.json y falla con BOM.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$pkgPath = Join-Path $stage 'package.json'
$pkg = Get-Content $pkgPath -Raw
$pkg = $pkg.Replace('"postinstall": "prisma generate"', '"postinstall": "cd \"$INIT_CWD\" && prisma generate"')
[System.IO.File]::WriteAllText($pkgPath, $pkg, $utf8NoBom)
Copy-Item (Join-Path $root 'backend\dist') (Join-Path $stage 'dist') -Recurse
New-Item -ItemType Directory -Path (Join-Path $stage 'prisma') | Out-Null
Copy-Item (Join-Path $root 'backend\prisma\schema.prisma') (Join-Path $stage 'prisma')
Copy-Item (Join-Path $root 'frontend\dist') (Join-Path $stage 'public') -Recurse

$envExample = @'
# Banquito Solidario - variables de entorno de PRODUCCION
# Copiar a .env en la raiz de la app del servidor y editar con los datos del hosting.
# IMPORTANTE: cambiar los JWT secrets por valores aleatorios largos.

DATABASE_URL="mysql://USUARIO_BD:PASSWORD_BD@localhost:3306/nombre_bd?connection_limit=10&pool_timeout=10"
PORT=3000
NODE_ENV=production
JWT_SECRET=CAMBIAR_POR_UN_SECRETO_ALEATORIO_LARGO
JWT_REFRESH_SECRET=CAMBIAR_POR_OTRO_SECRETO_ALEATORIO_LARGO
JWT_EXPIRES_IN=8h
UPLOAD_DIR=uploads
CORS_ORIGINS=https://TU-SUBDOMINIO.TUDOMINIO.COM
'@
[System.IO.File]::WriteAllText((Join-Path $stage '.env.example'), $envExample, $utf8NoBom)

Write-Host '==> 4/4 Comprimiendo ZIP...' -ForegroundColor Cyan
if (Test-Path $zip) { Remove-Item -Force $zip }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip

$sizeMB = [math]::Round((Get-Item $zip).Length / 1MB, 2)
Write-Host "Listo: $zip ($sizeMB MB)" -ForegroundColor Green
Write-Host 'Recuerda: NO subir node_modules. En el servidor: npm install --omit=dev'
