param(
    [int]$Port = 8000
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (!(Test-Path $backendPath)) {
    Write-Error "Backend folder not found: $backendPath"
    exit 1
}

Set-Location $backendPath

if (Test-Path $venvPython) {
    Write-Host "Starting backend with project venv python..." -ForegroundColor Cyan
    & $venvPython "main.py" --port $Port
} else {
    Write-Host "Project venv not found. Falling back to system python..." -ForegroundColor Yellow
    python "main.py" --port $Port
}
