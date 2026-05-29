param(
  [int]$Port = 5000
)

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $connections) {
  Write-Host "No process listening on port $Port"
  exit 0
}

$pids = $connections.OwningProcess | Sort-Object -Unique

foreach ($processId in $pids) {
  try {
    $proc = Get-Process -Id $processId -ErrorAction Stop
    Write-Host "Stopping $($proc.ProcessName) (PID $processId) on port $Port"
    Stop-Process -Id $processId -Force -ErrorAction Stop
  } catch {
    Write-Warning "Could not stop PID $processId : $($_.Exception.Message)"
  }
}

Write-Host "Port $Port cleared"
