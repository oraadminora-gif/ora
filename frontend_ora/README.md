# ORA — Objectif Réussir l'Apprentissage

Plateforme de mentorat qui met en relation des jeunes apprentis avec des seniors bénévoles. Développée pour **Talents Seniors Bénévoles** (TSB) dans le cadre du programme gouvernemental *1 jeune, 1 mentor*.

---

## Stack technique

| Couche | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4 |
| **Backend** | Django 5.2, Django REST Framework 3.16, SimpleJWT |
| **Base de données** | PostgreSQL (psycopg2) — SQLite en développement |
| **Cartographie** | react-simple-maps, géocodage api-adresse.data.gouv.fr |
| **Graphiques** | Recharts |
| **Export** | jsPDF, react-to-print, xlsx (openpyxl côté backend) |
| **Authentification** | JWT (access + refresh tokens) |

---

## Structure du projet

```
ORA_Site/
├── frontend_ora/       # Application React
│   ├── src/
│   │   ├── pages/      # Pages publiques et espaces membres
│   │   ├── components/ # Composants réutilisables
│   │   ├── contexts/   # AuthContext
│   │   ├── layouts/    # PublicLayout, MemberLayout, Footer, Headers
│   │   ├── routes/     # ProtectedRoute, MemberIndexRedirect
│   │   ├── services/   # api.ts, kpiService.ts
│   │   └── types/      # Types TypeScript partagés
│   └── public/         # Logos (AGIR.png, ECTI.png, EGEE.png, OTECI.png,
│                         DJEPVA.png, TSB.png, ase_lyon.png, image.png…)
└── ora_backend/        # API Django
    ├── core/
    │   ├── models/     # Tous les modèles métier
    │   └── services/   # geocoding.py, matching.py
    └── api/
        ├── views/      # Vues par rôle (cn/, acp/, ap/, pole/, public/)
        └── serializers/
```

---

## Rôles utilisateurs

| Rôle | Accès |
|---|---|
| **CN** | Comité National — administration globale, KPIs nationaux, configuration |
| **ACP** | Animateur Coordinateur de Pôle — gestion du pôle, affectations, mentorats |
| **AP** | Animateur de Pôle — suivi des mentorats, confirmation de clôtures |
| **Mentor** | Bénévole senior — tableau de bord perso, historique des mentorats |

---

## Pages publiques

| Route | Page |
|---|---|
| `/` | Accueil |
| `/a-propos` | À propos d'ORA |
| `/apprentis` | Information apprentis |
| `/apprentis/inscription` | Formulaire de demande d'accompagnement |
| `/mentors` | Devenir mentor |
| `/mentors/inscription` | Formulaire d'inscription mentor |
| `/faq` | Foire aux questions |
| `/temoignages` | Témoignages |
| `/partenaires` | Réseau associatif (AGIRabcd, ECTI, EGEE, OTECI) |
| `/soutiens` | Ceux qui nous soutiennent (DJEPVA, TSB, ASE) |
| `/cfa-partenaires` | Nos CFA partenaires |
| `/implantations` | Carte des implantations et pôles |
| `/contact` | Formulaire de contact |
| `/evaluer-mentor/:token` | Évaluation post-mentorat (sans authentification) |
| `/mentions-legales` | Mentions légales |
| `/politique-confidentialite` | Politique de confidentialité |
| `/cgv` | Conditions générales d'utilisation |
| `/login` | Connexion espace membre |

---

## Lancer le projet en développement

### Backend

```bash
cd ora_backend
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

L'API est disponible sur `http://localhost:8000`.

### Frontend

```bash
cd frontend_ora
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

---

## Variables d'environnement (backend)

Créer un fichier `.env` dans `ora_backend/` :

```env
SECRET_KEY=votre_secret_django
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
FRONTEND_URL=http://localhost:5173
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
```

En production, `FRONTEND_URL` doit pointer vers le domaine réel (utilisé pour les liens d'évaluation envoyés par email).

---

## Commandes utiles

```bash
# Vérification TypeScript (frontend)
cd frontend_ora && npx tsc --noEmit

# Lint (frontend)
npm run lint

# Build de production (frontend)
npm run build

# Migrations Django
python manage.py makemigrations
python manage.py migrate

# Tests Django
pytest
```

---

## Associations partenaires

ORA est coordonné par **Talents Seniors Bénévoles**, qui fédère quatre associations nationales :

- **AGIRabcd** — Association Générale des Intervenants Retraités
- **ECTI** — Entreprises, Collectivités Territoriales et Initiatives
- **EGEE** — Entente des Générations pour l'Emploi et l'Entreprise
- **OTECI** — Organisation Technique Européenne pour la Coopération Internationale

---

© 2026 ORA — Pour Talents Seniors Bénévoles
