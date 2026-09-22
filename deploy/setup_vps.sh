#!/bin/bash
# ============================================================
#  ORA — Installation initiale sur Hetzner Cloud
#  Serveur recommandé : CX22 (2 vCPU, 4 Go RAM, 40 Go SSD) ~4€/mois
#  OS : Ubuntu 24.04 LTS
#
#  AVANT de lancer ce script :
#  1. Créer le serveur sur console.hetzner.com
#  2. Pointer le DNS de ton domaine vers l'IP du serveur
#  3. Uploader ce script + .env.production sur le serveur :
#     scp deploy/setup_vps.sh deploy/.env.production root@IP_HETZNER:/root/
#  4. Se connecter : ssh root@IP_HETZNER
#  5. Lancer avec le mot de passe DB en variable d'environnement (jamais en dur ici) :
#     DB_PASSWORD='...' bash setup_vps.sh
#     (doit être identique à PROD_DB_PASSWORD dans .env.production)
# ============================================================

set -e

# ── À personnaliser ──────────────────────────────────────────
DOMAIN="objectifreussirapprentissage.eu"
ADMIN_EMAIL="admin@objectifreussirapprentissage.eu"
REPO_URL="https://github.com/oraadminora-gif/ora.git"
# Doit être défini dans l'environnement avant de lancer ce script, ex :
#   DB_PASSWORD='...' bash setup_vps.sh
# Doit être identique à PROD_DB_PASSWORD dans .env.production.
DB_PASSWORD="${DB_PASSWORD:?Erreur: définir DB_PASSWORD comme variable d'environnement avant d'exécuter ce script}"
PROJECT_DIR="/var/www/ora"
# ─────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ORA — Installation VPS Hetzner          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo "=== [1/10] Mise à jour système ==="
apt update && apt upgrade -y

echo "=== [2/10] Installation des dépendances ==="
apt install -y \
    python3.12 python3.12-venv python3-pip \
    postgresql postgresql-contrib \
    nginx certbot python3-certbot-nginx \
    fail2ban \
    nodejs npm \
    git ufw curl

echo "=== [3/10] Pare-feu UFW ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "Pare-feu activé."

echo "=== [4/10] PostgreSQL — création base de données ==="
sudo -u postgres psql <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ora_user') THEN
    CREATE USER ora_user WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;
CREATE DATABASE ora_db OWNER ora_user;
GRANT ALL PRIVILEGES ON DATABASE ora_db TO ora_user;
EOF
echo "Base de données créée."

echo "=== [5/10] Clonage du projet ==="
mkdir -p $PROJECT_DIR
git clone $REPO_URL $PROJECT_DIR
cd $PROJECT_DIR

echo "=== [6/10] Configuration du fichier .env ==="
cp /root/.env.production $PROJECT_DIR/.env
echo ".env copié."

echo "=== [7/10] Backend Django ==="
python3.12 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r ora_backend/requirements.txt --quiet
pip install gunicorn --quiet

cd $PROJECT_DIR/ora_backend
python manage.py migrate --noinput
python manage.py createcachetable
python manage.py collectstatic --noinput

echo ""
echo "  ► Pour charger les données existantes :"
echo "    python manage.py loaddata /root/backup_2026-07-01.json"
echo ""

echo "=== [8/10] Frontend React — build de production ==="
cd $PROJECT_DIR/frontend_ora
npm install --silent
npm run build
mkdir -p $PROJECT_DIR/frontend_build
cp -r dist/. $PROJECT_DIR/frontend_build/
echo "Build React copié dans $PROJECT_DIR/frontend_build/"

echo "=== [9/10] Services Nginx + Gunicorn ==="
mkdir -p /var/log/ora /run/ora
chown www-data:www-data /var/log/ora

cp $PROJECT_DIR/deploy/gunicorn.conf.py $PROJECT_DIR/
cp $PROJECT_DIR/deploy/ora.service /etc/systemd/system/ora.service
systemctl daemon-reload
systemctl enable ora
systemctl start ora

# Remplace le domaine dans la config Nginx
sed "s/objectifreussirapprentissage.eu/$DOMAIN/g" $PROJECT_DIR/deploy/ora_nginx.conf \
    > /etc/nginx/sites-available/ora
ln -sf /etc/nginx/sites-available/ora /etc/nginx/sites-enabled/ora
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== SSL Let's Encrypt ==="
certbot --nginx -d $DOMAIN -d www.$DOMAIN \
    --non-interactive --agree-tos -m $ADMIN_EMAIL

echo "=== [10/10] fail2ban — protection anti brute-force ==="
# [sshd] est déjà activé par défaut par le paquet fail2ban sur Ubuntu.
# On ajoute les jails spécifiques à ORA (login JWT + login admin Django).
cp $PROJECT_DIR/deploy/fail2ban/filter.d/ora-login.conf       /etc/fail2ban/filter.d/
cp $PROJECT_DIR/deploy/fail2ban/filter.d/ora-admin-login.conf /etc/fail2ban/filter.d/
cp $PROJECT_DIR/deploy/fail2ban/jail.d/ora.conf                /etc/fail2ban/jail.d/
systemctl enable fail2ban
systemctl restart fail2ban
echo "fail2ban configuré (jails : sshd, ora-login, ora-admin-login)."

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✓ Installation terminée !               ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Site         : https://$DOMAIN"
echo "  API          : https://$DOMAIN/api/"
echo "  Admin Django : https://$DOMAIN/shams/"
echo ""
echo "  Prochaine étape — créer le compte admin :"
echo "  cd $PROJECT_DIR && source .venv/bin/activate"
echo "  cd ora_backend && python manage.py createsuperuser"
echo ""
