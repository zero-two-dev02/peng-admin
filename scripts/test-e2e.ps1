[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$frontendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$nodeExecutable = (Get-Command node -ErrorAction Stop).Source
$viteEntry = Join-Path $frontendRoot 'node_modules/vite/bin/vite.js'
$viteProcess = $null

if (-not (Test-Path -LiteralPath $viteEntry -PathType Leaf)) {
    throw 'Vite is not installed. Run pnpm install --frozen-lockfile first.'
}

try {
    $viteProcess = Start-Process -FilePath $nodeExecutable -ArgumentList @(
        $viteEntry, '--host', '127.0.0.1', '--port', '5174', '--strictPort'
    ) -WorkingDirectory $frontendRoot -WindowStyle Hidden -PassThru

    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($viteProcess.HasExited) {
            throw "Vite exited before readiness with code $($viteProcess.ExitCode)."
        }
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:5174' -TimeoutSec 1
            if ($response.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }
    if (-not $ready) {
        throw 'Vite did not become ready on http://127.0.0.1:5174.'
    }

    & pnpm exec playwright test
    if ($LASTEXITCODE -ne 0) {
        throw "Playwright failed with exit code $LASTEXITCODE."
    }
} finally {
    if ($null -ne $viteProcess -and -not $viteProcess.HasExited) {
        Stop-Process -Id $viteProcess.Id -ErrorAction SilentlyContinue
        [void] $viteProcess.WaitForExit(5000)
    }
}
