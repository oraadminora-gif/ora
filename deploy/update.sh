#!/bin/bash
# ============================================================
#  ORA — Mise à jour du site
#  Lancé automatiquement par GitHub Actions (après validation),
#  ou à la main sur le VPS : bash /var/www/ora/deploy/update.sh
# ============================================================

# Tout le script est dans une fonction : bash le lit en entier avant de
# l'exécuter, donc le « git pull » peut modifier ce fichier sans risque.
main() {
    set -euo pipefail
    PROJECT_DIR="/var/www/ora"
    SITE_URL="https://objectifreussirapprentissage.eu"

    # Un seul déploiement à la fois sur le serveur
    exec 9>/run/ora_update.lock
    if ! flock -n 9; then
        echo "✗ Un déploiement est déjà en cours." >&2
        exit 1
    fi

    cd "$PROJECT_DIR"

    echo "→ [1/7] Pull GitHub..."
    git pull --ff-only origin main
    echo "   Version : $(git log -1 --format='%h %s')"

    echo "→ [2/7] Sauvegarde de la base avant migration..."
    bash "$PROJECT_DIR/deploy/backup_db.sh"

    echo "→ [3/7] Dépendances Python..."
    source .venv/bin/activate
    pip install -r ora_backend/requirements.txt --quiet

    echo "→ [4/7] Migrations + collectstatic..."
    cd "$PROJECT_DIR/ora_backend"
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput --clear

    echo "→ [5/7] Build frontend React..."
    cd "$PROJECT_DIR/frontend_ora"
    npm install --silent
    npm run build
    rm -rf "$PROJECT_DIR"/frontend_build/*
    cp -r dist/. "$PROJECT_DIR/frontend_build/"

    echo "→ [6/7] Redémarrage services..."
    systemctl restart ora
    nginx -t && systemctl reload nginx

    echo "→ [7/7] Vérification que le site répond..."
    for i in 1 2 3 4 5 6; do
        if curl -fsS -o /dev/null "$SITE_URL/api/public/stats/"; then
            echo "✓ Mise à jour terminée — $(date '+%d/%m/%Y %H:%M')"
            exit 0
        fi
        sleep 5
    done
    echo "✗ Le site ne répond pas après le redémarrage : voir journalctl -u ora" >&2
    exit 1
}

main "$@"
