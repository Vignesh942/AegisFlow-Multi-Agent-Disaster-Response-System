Write-Host "=== AegisFlow Backend Starter ===" -ForegroundColor Cyan
Write-Host ""

# Kill any existing process on port 8000 to avoid WINERROR 10048
Write-Host "Checking for processes on port 8000..." -ForegroundColor Yellow
$portProcesses = netstat -ano | Select-String ":8000 " | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Sort-Object -Unique
foreach ($pid in $portProcesses) {
    if ($pid -match '^\d+$' -and $pid -ne '0') {
        Write-Host "  Stopping PID $pid on port 8000..." -ForegroundColor DarkYellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Milliseconds 500

Set-Location $PSScriptRoot

if (-not (Test-Path ".venv\Scripts\Activate.ps1")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

& ".venv\Scripts\Activate.ps1"

Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt -q

Write-Host ""
Write-Host "Starting AegisFlow backend on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
