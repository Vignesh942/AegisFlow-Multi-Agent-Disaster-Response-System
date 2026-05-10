param(
    [int]$ApiPort = 8000
)

Set-Location "$PSScriptRoot\frontend"

if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
}

$apiBase = "http://localhost:$ApiPort"
if (Test-Path ".env") {
    $content = Get-Content ".env" -ErrorAction SilentlyContinue
    $otherLines = @($content | Where-Object { $_ -notmatch "^VITE_API_BASE=" })
    $newLines = @($otherLines + "VITE_API_BASE=$apiBase")
    Set-Content ".env" $newLines
}

Write-Host "Using API base: $apiBase"
Write-Host "Starting frontend at http://localhost:5173"
npm run dev
