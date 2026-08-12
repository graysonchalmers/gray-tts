<#
  GrayTTS backup -> V:\Projects work\GrayTTS
  Two layers:
   1. "current\"   = always-up-to-date mirror (fast, incremental; mirrors deletions)
   2. "snapshots\" = dated .zip point-in-time backups (keeps the last 10)
  Just double-click "Backup GrayTTS to V.bat" to run.
#>
$ErrorActionPreference = 'Stop'

$Src     = 'C:\Projects-local\Tool-GrayTTS'
$DstRoot = 'V:\Projects work\GrayTTS'
$Keep    = 10
$stamp   = Get-Date -Format 'yyyy-MM-dd_HHmm'
$LogFile = Join-Path $PSScriptRoot 'backup.log'

function Write-Log($msg) {
    "$( Get-Date -Format 'yyyy-MM-dd HH:mm:ss' )  $msg" | Add-Content -LiteralPath $LogFile
}

Write-Host "=== GrayTTS backup  $stamp ===" -ForegroundColor Cyan

# Source guard -- typo/move protection
if (-not (Test-Path -LiteralPath $Src)) {
    Write-Host "Source not found: $Src -- NOTHING was backed up." -ForegroundColor Red
    Write-Log "ABORT: source not found ($Src)"
    exit 1
}

# Drive guard -- V: must be mounted or this bails cleanly, no half-written backup
if (-not (Test-Path -LiteralPath 'V:\')) {
    Write-Host ""
    Write-Host "V: drive not found -- NOTHING was backed up." -ForegroundColor Red
    Write-Host "Mount the V: drive and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Log "ABORT: V: drive not mounted"
    exit 1
}

# Built by string concatenation, NOT Join-Path, so a missing drive letter fails
# at the guard above instead of throwing a raw DriveNotFoundException here.
$Mirror  = "$DstRoot\current"
$SnapDir = "$DstRoot\snapshots"

# Ensure destination structure exists
New-Item -ItemType Directory -Force -Path $Mirror, $SnapDir | Out-Null

# 1) Incremental mirror (excludes throwaway/rebuildable folders; .git excluded on
#    purpose -- git already versions itself, this backs up the working folder)
Write-Host "-> Mirroring to: $Mirror" -ForegroundColor Yellow
robocopy $Src $Mirror /MIR /XD .git node_modules /R:1 /W:1 /NFL /NDL /NP
if ($LASTEXITCODE -ge 8) {
    Write-Host "robocopy reported errors (exit $LASTEXITCODE). Backup aborted." -ForegroundColor Red
    Write-Log "ABORT: robocopy exit $LASTEXITCODE"
    exit 1
}

# 2) Dated zip snapshot from the fresh mirror
$zip = Join-Path $SnapDir "GrayTTS_$stamp.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Write-Host "-> Zipping snapshot: $zip" -ForegroundColor Yellow
Compress-Archive -Path (Join-Path $Mirror '*') -DestinationPath $zip -CompressionLevel Optimal

# 3) Prune old snapshots, keep the newest $Keep (name-scoped so a shared
#    snapshots\ folder never touches another project's archives)
$old = Get-ChildItem $SnapDir -Filter 'GrayTTS_*.zip' | Sort-Object LastWriteTime -Descending | Select-Object -Skip $Keep
if ($old) {
    $old | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "-> Pruned $($old.Count) old snapshot(s), kept newest $Keep." -ForegroundColor DarkGray
}

$sizeMB = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host ""
Write-Host "DONE." -ForegroundColor Green
Write-Host "  Mirror   : $Mirror" -ForegroundColor Green
Write-Host "  Snapshot : $zip  ($sizeMB MB)" -ForegroundColor Green

Write-Log "OK: mirrored to $Mirror; snapshot $zip ($sizeMB MB); pruned to newest $Keep"
