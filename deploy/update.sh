#!/bin/bash
# ============================================================
#  ORA — Mise à jour après chaque push GitHub
#  À lancer sur le VPS : bash /var/www/ora/deploy/update.sh
# ============================================================

set -e
PROJECT_DIR="/var/www/ora"
cd $PROJECT_DIR

echo "→ [1/5] Pull GitHub..."
git pull origin main

echo "→ [2/5] Dépendances Python..."
source .venv/bin/activate
pip install -r ora_backend/requirements.txt --quiet

echo "→ [3/5] Migrations + collectstatic..."
cd $PROJECT_DIR/ora_backend
python manage.py migrate --noinput
python manage.py collectstatic --noinput --clear

echo "→ [4/5] Build frontend React..."
cd $PROJECT_DIR/frontend_ora
npm install --silent
npm run build
rm -rf $PROJECT_DIR/frontend_build/*
cp -r dist/. $PROJECT_DIR/frontend_build/

echo "→ [5/5] Redémarrage services..."
systemctl restart ora
nginx -t && systemctl reload nginx

echo "✓ Mise à jour terminée — $(date '+%d/%m/%Y %H:%M')"
