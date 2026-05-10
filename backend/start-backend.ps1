param(
    [int]$Port = 8000
)

Set-Location $PSScriptRoot

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created backend\.env from .env.example"
}

$selectedPort = $Port
for ($i = 0; $i -lt 20; $i++) {
    $checkPort = $Port + $i
    $busy = netstat -ano | Select-String ":$checkPort " | Select-String "LISTENING"
    if (-not $busy) {
        $selectedPort = $checkPort
        break
    }
}

if ($selectedPort -ne $Port) {
    Write-Host "Port $Port is busy. Falling back to $selectedPort."
}

Write-Host "Starting backend at http://localhost:$selectedPort"
python -m uvicorn main:app --reload --port $selectedPort
