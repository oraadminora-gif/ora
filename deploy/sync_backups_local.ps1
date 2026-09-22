# ============================================================
#  ORA - Copie locale des sauvegardes PostgreSQL du serveur
#  Planifie via le Planificateur de taches Windows
# ============================================================

$ErrorActionPreference = "Stop"

$RemoteHost = "root@objectifreussirapprentissage.eu"
$SshKey     = "$env:USERPROFILE\.ssh\id_ed25519"
$RemotePath = "/var/www/ora/backups/ora_db_*.sql.gz"
$LocalDir   = "D:\M1_NEXA\ORA_Site\backups"
$LogFile    = "D:\M1_NEXA\ORA_Site\backups\sync.log"
$RetentionDays = 60   # garde deux fois plus longtemps qu'en local sur le serveur (30 j)

New-Item -ItemType Directory -Force -Path $LocalDir | Out-Null

function Log($msg) {
    $line = "$(Get-Date -Format 'dd/MM/yyyy HH:mm') - $msg"
    Add-Content -Path $LogFile -Value $line
    Write-Output $line
}

try {
    & scp.exe -i $SshKey -o StrictHostKeyChecking=no "${RemoteHost}:${RemotePath}" "$LocalDir\" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "scp a echoue (code $LASTEXITCODE)" }

    # Rotation locale : supprime les sauvegardes de plus de $RetentionDays jours
    Get-ChildItem "$LocalDir\ora_db_*.sql.gz" -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
        Remove-Item -Force

    $count = (Get-ChildItem "$LocalDir\ora_db_*.sql.gz" -ErrorAction SilentlyContinue).Count
    Log "OK - $count sauvegarde(s) en local"
}
catch {
    Log "ECHEC - $_"
    exit 1
}
