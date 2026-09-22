#!/bin/bash
# ============================================================
#  ORA — Sauvegarde quotidienne de la base PostgreSQL (locale)
#  Cron (root) : 0 2 * * * bash /var/www/ora/deploy/backup_db.sh
# ============================================================
set -e

DB_NAME="ora_db"
BACKUP_DIR="/var/www/ora/backups"
LOG_FILE="/var/log/ora/backup.log"
RETENTION_DAYS=30
TIMESTAMP=$(date '+%Y-%m-%d_%Hh%M')
FILENAME="ora_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# pg_dump exécuté en tant qu'utilisateur système "postgres" (authentification
# peer locale) — pas besoin du mot de passe applicatif.
if sudo -u postgres pg_dump "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"; then
    SIZE=$(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)
    echo "$(date '+%d/%m/%Y %H:%M') — OK : $FILENAME ($SIZE)" >> "$LOG_FILE"
else
    echo "$(date '+%d/%m/%Y %H:%M') — ÉCHEC de la sauvegarde !" >> "$LOG_FILE"
    rm -f "$BACKUP_DIR/$FILENAME"
    exit 1
fi

# Rotation : ne garde que les RETENTION_DAYS derniers jours
find "$BACKUP_DIR" -name 'ora_db_*.sql.gz' -mtime +$RETENTION_DAYS -delete
