param(
    [string]$BackendPath = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent),
    [string]$AdminUsername = 'peng_admin',
    [switch]$Build
)

$ErrorActionPreference = 'Stop'
$startScript = Join-Path $BackendPath 'infra/local-stack/start.ps1'
if (-not (Test-Path -LiteralPath $startScript -PathType Leaf)) {
    throw "Backend local-stack launcher was not found: $startScript"
}

& $startScript -AdminUsername $AdminUsername -Build:$Build
