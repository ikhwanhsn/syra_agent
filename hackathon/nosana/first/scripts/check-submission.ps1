# Preflight checks before Docker / Nosana.
# Run from repo anywhere: powershell -ExecutionPolicy Bypass -File path\to\check-submission.ps1

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

Write-Host "== Syra Brief submission preflight ==" -ForegroundColor Cyan
Write-Host "Root: $root"

if (-not (Test-Path ".\package.json")) {
  Write-Host "ERROR: package.json missing. Expected hackathon/nosana/first." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "[1] pnpm run build" -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2] .env present (never commit)" -ForegroundColor Yellow
if (Test-Path ".\.env") {
  Write-Host "OK: .env exists" -ForegroundColor Green
}
else {
  Write-Host "WARN: copy .env.example to .env" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "[3] Docker engine" -ForegroundColor Yellow
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
docker version 2>$null | Out-Null | Out-Null
$dockerExit = $LASTEXITCODE
$ErrorActionPreference = $prevEap
if ($dockerExit -eq 0) {
  Write-Host "OK: docker responds" -ForegroundColor Green
}
else {
  Write-Host "WARN: Docker engine not running (start Docker Desktop, then re-run)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "[4] Manual next steps" -ForegroundColor Yellow
Write-Host "  - Edit nos_job_def/nosana_eliza_job_definition.json image name"
Write-Host "  - docker build / docker push / deploy.nosana.com"
Write-Host "  - Public GitHub + Superteam form + stars + social #NosanaAgentChallenge @nosana_ai"
Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
