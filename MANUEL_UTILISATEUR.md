# Manuel d'utilisation — Plateforme ORA

> **ORA — Objectif Réussir l'Apprentissage**
> Plateforme de mise en relation entre jeunes apprentis et mentors bénévoles seniors,
> coordonnée par des animateurs de pôle répartis sur toute la France.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Site public](#2-site-public)
3. [Guide du Jeune](#3-guide-du-jeune)
4. [Guide du Mentor](#4-guide-du-mentor)
5. [Guide de l'AP — Animateur de Pôle](#5-guide-de-lap--animateur-de-pôle)
6. [Guide de l'ACP — Animateur Coordinateur de Pôle](#6-guide-de-lacp--animateur-coordinateur-de-pôle)
7. [Guide du CN — Coordination Nationale](#7-guide-du-cn--coordination-nationale)
8. [Cycle de vie d'un mentorat](#8-cycle-de-vie-dun-mentorat)
9. [Système d'évaluation](#9-système-dévaluation)
10. [Gestion des financements](#10-gestion-des-financements)
11. [Administration Django](#11-administration-django)
12. [Design System](#12-design-system)

---

## 1. Vue d'ensemble

### 1.1 Qui fait quoi ?

| Profil | Rôle dans la plateforme |
|--------|------------------------|
| **Jeune** | S'inscrit via le formulaire public, reçoit un mentor, évalue le mentorat en fin de parcours |
| **Mentor** | Professionnel retraité bénévole, suit ses jeunes, enregistre ses rencontres, demande la clôture |
| **AP** (Animateur de Pôle) | Encadre les mentors de **son association** au sein du pôle, valide les clôtures |
| **ACP** (Animateur Coordinateur) | Pilote l'ensemble du pôle, affecte les mentors aux demandes, gère animateurs et établissements. **Hérite des droits AP** |
| **CN** (Coordination Nationale) | Vue nationale : gère pôles, mentors, animateurs et statistiques selon son niveau d'accès |

### 1.2 Périmètre des données

| Profil | Ce qu'il voit |
|--------|--------------|
| **Mentor** | Uniquement ses propres mentorats |
| **AP** | Les mentors de **son association dans son pôle** |
| **ACP** | **Tous** les mentors et mentorats de **son pôle** |
| **CN** | L'ensemble du territoire national |

### 1.3 Statuts clés

| Objet | Statuts possibles |
|-------|------------------|
| Demande jeune | `NEW` → `PENDING` → `ASSIGNED` → `CLOSED` |
| Mentorat | `PENDING` → `ACTIVE` → `CLOSED` (fin normale) ou `ABORTED` (arrêt) |
| Pôle | `ACTIVE` / `INACTIVE` |

> **Important :** les statuts s'écrivent en **MAJUSCULES** dans le code et les comparaisons.

---

## 2. Site public

Le site public est entièrement accessible sans connexion. Il présente ORA aux jeunes, aux futurs mentors et aux partenaires.

### 2.1 Navigation principale (Header)

Barre fixe en haut, fond noir (`#1a1a1a`), visible sur toutes les pages publiques.

| Élément | URL | Visible si |
|---------|-----|-----------|
| Logo ORA | `/` | Toujours — retour à l'accueil |
| ORA c'est quoi ? | `/ora` | Toujours |
| Tu es apprenti(e) | `/apprentis` | Toujours |
| Devenir mentor | `/mentors` | Toujours |
| **Mon espace** | Dashboard selon rôle | Connecté |
| **Déconnexion** | — | Connecté |
| **🔒 Espace Membre** | `/login` | Non connecté |

Sur mobile : les liens sont regroupés dans un menu hamburger (☰ / ✕).

---

### 2.2 Page d'accueil (`/`)

La page d'accueil présente ORA de haut en bas, en sept sections.

#### Section 1 — Hero

Fond dégradé bleu marine foncé, deux colonnes :

- **Gauche** : image illustrative `image_hero.png` avec halo lumineux orange/bleu
- **Droite** :
  - Badge animé : « Gratuit · Bénévole · Confidentiel » avec point pulsant bleu
  - Titre principal : *"ORA a envie / **de te voir réussir.**"* (le second vers en orange `#F05A28`)
  - Sous-titre discret : *"À toi d'en décider."*
  - Description courte du dispositif
  - Séparateur avec le nom complet *Objectif Réussir l'Apprentissage*

#### Section 2 — Deux portes (entrées principales)

Grille 3 colonnes : la première carte occupe 2/3, la seconde 1/3.

| Carte | Destinataire | Contenu | Bouton principal |
|-------|-------------|---------|-----------------|
| **Tu veux être accompagné(e) ?** *(orange, large)* | Jeunes | 2 sous-cartes : "Je m'oriente vers l'apprentissage" et "Je suis déjà en apprentissage" | **LE MENTORAT C'EST POUR MOI** → `/ora` |
| **Vous souhaitez prendre contact ?** *(bleu)* | Mentors potentiels, CFA, institutions | Texte d'invitation | **Devenir Mentor** → `/mentors` · **Autre contact** → `/contact` |

#### Section 3 — Présents (Carte France)

Fond clair (`bg-slate-50`), deux colonnes :

- **Gauche** : carte de France statique (`map-france.png`) — cliquable → `/implantations`
- **Droite** : texte + bouton **"Trouver mon pôle"** → `/implantations`

#### Section 4 — ORA en chiffres

4 compteurs animés :

| Valeur | Label | Source |
|--------|-------|--------|
| 1 000+ | Jeunes accompagnés | Fixe |
| 300+ | Mentors bénévoles | Fixe |
| *dynamique* | Départements couverts | API `/public/stats/` |
| *dynamique* | Pôles actifs | API `/public/stats/` |

#### Section 5 — Pourquoi choisir l'accompagnement ORA ?

3 arguments illustrés :

| Icône | Titre | Couleur |
|-------|-------|---------|
| ShieldCheck | **le mentorat** | Bleu |
| GraduationCap | **en vue** | Orange |
| TrendingUp | **Confiance retrouvée** | Vert |

#### Section 6 — Nos valeurs

4 cartes en grille 2×2 :

| Valeur | Icône | Couleur |
|--------|-------|---------|
| Bienveillance | Heart | Rose |
| Confidentialité | Lock | Bleu |
| Sur mesure | SlidersHorizontal | Violet |
| Engagement | BadgeCheck | Vert |

#### Section 7 — Ils nous soutiennent / font confiance / témoignent

3 cartes :

| Carte | Icône | Bouton |
|-------|-------|--------|
| **Ils nous soutiennent** | HandHeart (vert) | Voir notre réseau associatif → `/partenaires` |
| **Ils nous font confiance** | GraduationCap (bleu) | Voir nos CFA partenaires → `/partenaires` |
| **Ils témoignent** | Quote (orange) | Voir les témoignages → `/temoignages` |

---

### 2.3 Pied de page (Footer)

4 colonnes :

| Colonne | Liens |
|---------|-------|
| Logo + description | Logo cliquable → `/` |
| **Navigation** | Je suis apprenti(e) · Devenir mentor · FAQ |
| **Ressources** | Notre réseau associatif · Nos implantations · Contact |
| **Légal** | Mentions légales · Politique de confidentialité · CGU |

En bas : *© 2026 ORA - Joashams / Pour Talents Seniors Bénévoles*
Lien discret **Design System** → `/charte` (usage interne équipe)

---

### 2.4 Pages d'information

| Page | URL | Contenu |
|------|-----|---------|
| ORA c'est quoi ? | `/ora` | Histoire, missions, fonctionnement du dispositif |
| Tu es apprenti(e) | `/apprentis` | Accompagnement disponible, engagements du jeune |
| Devenir mentor | `/mentors` | Rôle du mentor, engagement, avantages |
| FAQ | `/faq` | Questions fréquentes |
| Témoignages | `/temoignages` | Avis filtrables : Apprentis, Mentors, CFA |
| Notre réseau associatif | `/partenaires` | Partenaires et associations nationales |
| Nos implantations | `/implantations` | Carte des pôles actifs en France |
| Contact | `/contact` | Formulaire de contact |
| Mentions légales | `/mentions-legales` | Informations légales |
| Politique de confidentialité | `/politique-confidentialite` | RGPD |
| CGU | `/cgv` | Conditions générales d'utilisation |

---

### 2.5 Bandeau cookies (RGPD)

À la première visite, un bandeau apparaît après 800 ms :

- Cookies **techniques uniquement** (aucun traçage publicitaire)
- **"J'accepte"** → stocke le consentement (`localStorage`, clé `ora_cookie_consent`)
- **"En savoir plus"** → `/politique-confidentialite`
- Bouton **×** → ferme sans accepter

> Pour réinitialiser (développement) : supprimer la clé `ora_cookie_consent` dans le localStorage du navigateur.

---

## 3. Guide du Jeune

> Le jeune n'a pas de compte sur la plateforme. Toutes ses interactions passent par des formulaires publics et des emails.

### 3.1 Demander un mentor

**URL :** `/apprentis/inscription` — accessible depuis `/apprentis` ou la page d'accueil

Le formulaire comprend **6 sections** à remplir dans l'ordre.

---

#### Section 1 — Identité

| Champ | Requis | Notes |
|-------|--------|-------|
| Prénom | ✅ | |
| Nom | ✅ | |
| Email | ✅ | Adresse pour toutes les communications ORA |
| Téléphone | | |
| Date de naissance | | |
| Genre | | Garçon / Fille / Autre / Non précisé |

---

#### Section 2 — Localisation

| Champ | Requis | Notes |
|-------|--------|-------|
| Code postal | ✅ | **Dès 5 chiffres saisis**, le pôle ORA est détecté automatiquement |
| Commune | ✅ | Nom de ta ville — utilisé pour le matching géographique avec les mentors |

> **Bandeau vert** : pôle détecté — ta demande lui est transmise automatiquement.
>
> **Bandeau orange** : aucun pôle dans ta zone — contacter `ora-france@outlook.com` ou `/contact`. Le formulaire ne peut pas être soumis dans ce cas.

---

#### Section 3 — Scolarité

| Champ | Requis | Notes |
|-------|--------|-------|
| Diplôme préparé | | Niv. 3 : CAP, BEP / Niv. 4 : Bac Pro, Bac autre, BP / Niv. 5 : BTS, DUT / Niv. 6 : Licence Pro, BUT / Niv. 7 : Master, DEA, DES, Ingénieur |
| Situation actuelle | ✅ | **Déjà en apprentissage** ou **En recherche d'apprentissage** |
| Nom de l'école / CFA | | Visible **uniquement** si "Déjà en apprentissage" est sélectionné |

---

#### Section 4 — Ta demande

| Champ | Requis | Notes |
|-------|--------|-------|
| Exprime ta demande | ✅ | Zone de texte libre — décris sur quoi tu souhaites être accompagné(e) : difficultés avec l'employeur, organisation, orientation, recherche d'entreprise… |

---

#### Section 5 — Engagement

Case à cocher obligatoire :
> *"Je m'engage dans le mentorat et en accepte les règles."*

Un lien renvoie vers la page **"Tu es apprenti(e)"**, section *"À quoi je m'engage en demandant un mentor ?"*.

---

#### Section 6 — Confidentialité

Case à cocher obligatoire :
> *"J'accepte que mes données personnelles soient utilisées pour me mettre en relation avec un mentor. Mes données resteront confidentielles et ne seront pas partagées avec des tiers."*

Puis cliquer sur **"Envoyer ma demande"**.

---

#### Après l'envoi

Écran de confirmation :
> *"Inscription envoyée ! Nous allons étudier ta demande et te recontacter très prochainement."*

Ta demande arrive dans le tableau de bord de l'ACP du pôle avec le statut **NEW**. Un mentor te sera affecté dans les meilleurs délais.

---

### 3.2 Évaluer son mentor

Après confirmation de clôture du mentorat par l'AP ou l'ACP, tu reçois un **email** contenant un lien unique vers `/evaluer-mentor/:token`.

Étapes :

1. Cliquer sur le lien dans l'email *(aucune connexion requise)*
2. Choisir une note de **1 à 5 étoiles** (obligatoire)
3. Rédiger un commentaire libre (facultatif)
4. Cliquer **Envoyer**

> ⚠️ Le lien est **à usage unique** : une fois l'évaluation soumise, il ne fonctionne plus.

---

### 3.3 Formulaire de contact

**URL :** `/contact`

Pour toute question avant ou après l'inscription :

| Champ | Requis | Notes |
|-------|--------|-------|
| Nom complet | ✅ | |
| Email | ✅ | |
| Téléphone | ✅ | |
| Sujet | ✅ | Je suis apprenti(e) / Je veux devenir mentor / Partenariat / Presse-Média / Autre |
| Message | ✅ | |

Coordonnées affichées : `ora-france@outlook.com` · Lien vers la carte des implantations → `/implantations`

---

## 4. Guide du Mentor

### 4.1 Connexion

**URL :** `/login`

1. Saisir l'**email** et le **mot de passe** communiqués par l'animateur de pôle lors de la création du compte
2. Cliquer **Se connecter**
3. Redirection automatique vers `/member/mentor/dashboard`

> **Mot de passe oublié :** contacter son AP ou ACP, qui réinitialisera le mot de passe depuis l'administration.

---

### 4.2 Navigation — Barre latérale (Sidebar)

La sidebar foncée (dégradé bleu nuit) s'affiche à gauche sur toutes les pages membres. Elle contient :

- **Logo ORA** en haut
- **Profil** : initiales + nom + badge rôle vert "Mentor"
  - Icône **clé** (🔑) : ouvre le modal de changement de mot de passe
- **Menu :**
  - Mes mentorats → `/member/mentor/dashboard` (scroll vers la section mentorats)
- **Déconnexion** en bas

#### Changer son mot de passe

1. Cliquer sur l'icône clé (🔑) dans le bloc profil de la sidebar
2. Saisir le **mot de passe actuel**
3. Saisir le **nouveau mot de passe** (min. 8 caractères)
4. Confirmer le nouveau mot de passe
5. Cliquer **Modifier**

---

### 4.3 Tableau de bord — "Mon Espace Mentor"

Le tableau de bord comprend **4 blocs** :

| Bloc | Contenu |
|------|---------|
| **Mon profil** | Identité, email, téléphone, ville, code postal, pôle, association, statut "Formé" |
| **Mes disponibilités** | Capacité max fixée par l'ACP · Places disponibles · Places utilisées |
| **Mes mentorats actifs** | Liste des mentorats en cours |
| **Bilan** | Historique des mentorats clôturés + évaluations reçues |

---

### 4.4 Mettre à jour les informations du jeune

Depuis la carte d'un mentorat actif, cliquer sur le bouton de modification.

| Champ | Notes |
|-------|-------|
| **Situation** | "En apprentissage" ou "En recherche" |
| **Établissement / CFA** | Visible **uniquement si "En apprentissage"** — liste du pôle ou option "Autre" |
| Nom libre | Si "Autre" sélectionné |

Cliquer **Sauvegarder**.

---

### 4.5 Enregistrer une rencontre

Depuis la carte d'un mentorat actif, cliquer sur **"Enregistrer une rencontre"**.

| Champ | Requis | Notes |
|-------|--------|-------|
| Date de rencontre | ✅ | Date effective du contact |
| Durée | | En minutes |
| Type | | Présentiel / Téléphone / Visio / Autre |
| Objectifs atteints | | Oui / Non / Partiellement |
| Notes | | Compte-rendu libre, visible par l'AP et l'ACP |

> ✅ Enregistrer une rencontre **réinitialise le compteur d'inactivité**. La carte repassera au vert dans les tableaux de bord AP/ACP.

**Indicateur d'activité sur la carte :**

- 🟢 **Vert** : contact récent (< 15 jours)
- 🟡 **Jaune** : inactivité 15–30 jours
- 🔴 **Rouge** : inactivité > 30 jours

---

### 4.6 Demander la clôture d'un mentorat

1. Depuis la carte du mentorat actif, cliquer sur **"Clôturer"** (fin normale) ou **"Arrêter"** (interruption)
2. Choisir l'**action** : Clôturer / Arrêter
3. Saisir une **raison** (obligatoire)
4. Confirmer

> ⚠️ La demande **ne prend pas effet immédiatement**. Le mentorat reste `ACTIVE` avec un badge "En attente de validation". L'AP ou l'ACP doit confirmer ou rejeter la demande.

---

### 4.7 Bilan et évaluations reçues

Section **Bilan** en bas du tableau de bord.

Pour chaque mentorat clôturé :
- Nom du jeune, date de fin, raison de clôture
- Statistiques de suivi : nb rencontres, heures totales
- Si évaluation reçue : note en étoiles ★ + commentaire du jeune + date de soumission

La **note moyenne globale** est affichée au sommet de la section.

---

## 5. Guide de l'AP — Animateur de Pôle

> L'AP encadre uniquement les mentors de **son association** au sein de son pôle. Il ne voit pas les mentors des autres associations.

### 5.1 Connexion

**URL :** `/login` → redirection vers `/member/ap/dashboard`

---

### 5.2 Navigation — Sidebar

| Élément | Page |
|---------|------|
| Tableau de bord AP | `/member/ap/dashboard` |
| Gestion mentors | `/member/acp/mentors` |
| Déconnexion | — |
| Icône clé (🔑) | Modal changement de mot de passe |

---

### 5.3 Tableau de bord AP

#### Indicateurs (barre de stats)

| Indicateur | Description |
|-----------|-------------|
| **Mentors (asso.)** | Total mentors actifs dans l'association |
| **Mes mentorats** | Mentorats dont cet AP est l'animateur responsable |
| **Actifs (asso.)** | Tous les mentorats actifs de l'association |
| **Alertes rouges** | Mentorats avec flag critique activé |
| **Inactivité +30j** | Mentors sans contact depuis plus de 30 jours |
| **Dispo.** | Places disponibles dans l'association |

#### Section "Mes mentorats"

Chaque carte affiche :

- Nom du mentor (avatar initiales), statut du mentorat, badge "Formé" si applicable
- Association et ville du mentor
- Nom du jeune, ville, diplôme, situation, établissement *(si en apprentissage)*
- Statistiques : nb rencontres, heures de suivi, jours sans contact

**Cliquer sur une carte** ouvre le modal de suivi complet.

#### Section "Demandes en attente"

Liste des demandes de jeunes non encore affectées du pôle. Un AP peut créer une demande manuellement via le bouton **"Nouvelle"**.

#### Section "Clôtures en attente"

Apparaît automatiquement dès qu'un mentor soumet une demande de clôture. Voir [section 5.6](#56-valider-ou-rejeter-une-demande-de-clôture).

---

### 5.4 Créer une nouvelle demande manuellement

Bouton **"Nouvelle"** dans la section "Demandes en attente".

| Section | Champs clés |
|---------|-------------|
| **Identité** | Prénom ✅, Nom ✅, Email, Téléphone, Date naissance, Genre |
| **Localisation** | Code postal ✅, Commune ✅ |
| **Scolarité** | Diplôme préparé, Situation ✅ (boutons radio), CFA *(visible si "Déjà en apprentissage" uniquement)* |
| **Demande** | Texte libre ✅ décrivant l'accompagnement souhaité |
| **Urgence** | Niveau 1 (très faible) à 5 (très urgent) |

---

### 5.5 Modal de suivi d'un mentorat

Cliquer sur une carte de mentorat ouvre le modal avec les onglets :

| Onglet / Bouton | Ce que ça fait |
|----------------|---------------|
| **Modifier le suivi** | Formulaire de suivi complet (problématiques, alertes, infos jeune, notes) |
| **Rencontres** | Consulter et ajouter des rencontres |
| **Clôturer / Arrêter** | Déclencher directement une clôture (sans attendre la demande du mentor) |

#### Formulaire de suivi complet

**Problématiques identifiées** (cases à cocher) :

| Code | Libellé |
|------|---------|
| aide_informatique | Aide informatique |
| fle | Apprentissage du français (FLE) |
| changer_employeur | Changer d'employeur |
| handicap | Handicap |
| logement | Logement |
| orientation | Orientation |
| prob_administratif | Problème administratif |
| prob_financier | Problème financier / Gérer Budget |
| fragilite_mentale | Fragilité mentale |
| prep_dossier | Préparation dossier professionnel |
| relation_employeur | Relation avec l'employeur |
| recherche_contrat | Recherche contrat apprentissage |
| salaire | Salaire / Respect de convention |
| soutien_moral | Soutien moral |
| soutien_scolaire | Soutien scolaire |
| autre | Autre |

**Alertes & Dates :**

| Champ | Description |
|-------|-------------|
| Alerte rouge | Marque le mentorat comme critique — visible en rouge dans toutes les vues AP/ACP |
| Dernier contact | Date de dernier contact (saisie manuelle) |
| Date de fin prévue | Date prévisionnelle de fin |

**Informations du jeune :**

| Champ | Description |
|-------|-------------|
| Situation | "Déjà en apprentissage" / "En recherche d'apprentissage" |
| Établissement / CFA | Visible **uniquement si "Déjà en apprentissage"** — liste du pôle + option "Autre" + bouton "Ajouter" |
| Diplôme préparé | Mise à jour parmi les 13 options |
| Niveau d'urgence | 1 à 5 |

**Notes de suivi :** texte libre, visible par l'AP et l'ACP.

---

### 5.6 Valider ou rejeter une demande de clôture

La section **"Clôtures en attente"** s'affiche automatiquement dès qu'un mentor soumet une demande.

Pour chaque demande :

- Badge : "Demande de clôture" (vert) ou "Demande d'arrêt" (rouge)
- Nom du mentor et du jeune
- Raison fournie par le mentor
- **Message au jeune** : pré-rempli, modifiable par l'AP avant confirmation

| Bouton | Effet immédiat |
|--------|---------------|
| **Confirmer** | Mentorat → `CLOSED` ou `ABORTED`. Disponibilité mentor +1. Email + lien d'évaluation unique envoyé au jeune. |
| **Rejeter** | Demande annulée. Mentorat redevient pleinement actif. Le mentor peut soumettre une nouvelle demande. |

---

### 5.7 Page "Gestion mentors"

**URL :** `/member/acp/mentors` (accessible AP et ACP)

Liste de tous les mentors de l'association (AP) ou du pôle (ACP).

Actions disponibles sur chaque mentor :

- Voir le profil détaillé
- Consulter l'historique des mentorats

---

## 6. Guide de l'ACP — Animateur Coordinateur de Pôle

> L'ACP pilote l'ensemble du pôle. Il hérite de tous les droits AP et peut basculer vers la vue AP depuis la sidebar.

### 6.1 Connexion

**URL :** `/login` → redirection vers `/member/acp/dashboard`

---

### 6.2 Navigation — Sidebar

| Élément du menu | Page |
| ---------------- | ---- |
| Tableau de bord | `/member/acp/dashboard` |
| Vue Animateur | `/member/ap/dashboard` |
| Affectation | `/member/matching` |
| KPIs Pôle | `/member/pole/kpi` |
| Annuaire Pôle | `/member/acp/annuaire` |
| Gestion mentors | `/member/acp/mentors` |
| Gestion APs | `/member/acp/animateurs` |
| Suivi mentorats | `/member/acp/mentorats` |
| Icône clé (🔑) | Modal changement de mot de passe |

---

### 6.3 Dashboard ACP — Indicateurs

**Titre de la page :** "Espace Coordinateur" — affiche le nom de l'ACP et le nom du pôle.

| Indicateur | Description |
|-----------|-------------|
| **Associations** | Nombre d'associations dans le pôle + nombre d'AP |
| **Mentors** | Total mentors actifs + nombre disponibles |
| **Mentorats actifs** | Total des mentorats en cours |
| **Alertes rouges** | Mentorats en situation critique |
| **Inactivité +30j** | Mentors sans contact depuis plus de 30 jours |
| **Dispo.** | Total des places disponibles dans le pôle |
| **Demandes** | Demandes en attente d'affectation |
| **Animateurs** | Nombre d'AP/ACP actifs dans le pôle |

Le dashboard affiche aussi un **tableau par association** : nb mentors, mentorats actifs, alertes, inactifs, disponibilités.

La section **"Demandes en attente"** affiche les demandes non affectées avec le bouton **"Nouvelle"** pour en créer manuellement.

---

### 6.4 Affectation d'un mentor à une demande

**Menu :** "Affectation" → `/member/matching`

C'est la fonctionnalité centrale de l'ACP : faire correspondre une demande de jeune avec le mentor le plus approprié.

#### Étape 1 — Choisir une demande

Liste des demandes `NEW` ou `PENDING` avec : nom du jeune, diplôme, situation, commune et code postal, date, niveau d'urgence.

Cliquer sur une demande pour lancer la recherche de mentors.

#### Étape 2 — Analyser les suggestions

L'algorithme calcule un **score** pour chaque mentor disponible du pôle :

| Critère | Points |
|---------|--------|
| Places disponibles | `disponibilité × 25` (max 75 pts) |
| Distance ≤ 10 km | +80 pts |
| Distance ≤ 30 km | +60 pts |
| Distance ≤ 60 km | +40 pts |
| Distance > 60 km | +10 pts |
| Mentor formé | +15 pts |
| Expérience (mentorats terminés) | `nb × 3` (max 30 pts) |

**Couleur du badge de score :**
- 🟣 ≥ 120 pts — Excellent
- 🟢 ≥ 80 pts — Bon
- ⚫ < 80 pts — Acceptable

Chaque suggestion affiche un **badge de distance** en km (ex : "32 km").

#### Étape 3 — Confirmer l'affectation

1. Cliquer sur le mentor choisi
2. Sélectionner optionnellement l'**animateur responsable** (badge violet = ACP, bleu = AP)
3. Ajouter une justification si le choix diffère de la suggestion n°1
4. Cliquer **Confirmer l'affectation**

Résultat : mentorat créé (`ACTIVE`), demande → `ASSIGNED`, disponibilité mentor décrémentée de 1.

#### Rerouter une demande vers un autre pôle

Si la demande ne peut pas être traitée dans ce pôle :
1. Ouvrir la demande → bouton **Rerouter**
2. Sélectionner le pôle de destination
3. Confirmer

La demande disparaît de ce pôle et apparaît chez le pôle destinataire.

---

### 6.5 Créer une nouvelle demande manuellement

Bouton **"Nouvelle"** dans la section "Demandes en attente" du dashboard ou de la Vue Animateur.

Structure identique à la [section 5.4](#54-créer-une-nouvelle-demande-manuellement) :

- Situation avant Établissement/CFA
- CFA visible uniquement si "Déjà en apprentissage"
- Champ libre **Demande**

---

### 6.6 Suivi des mentorats

**Menu :** "Suivi mentorats" → `/member/acp/mentorats`

Vue de **tous les mentorats du pôle**, toutes associations confondues.

Filtres par statut : Actifs / Clôturés / Arrêtés / En attente.

#### Actions sur un mentorat actif

| Bouton | Ce que ça fait |
|--------|---------------|
| **Modifier** | Modal d'administration : statut, mentor, pôle, AP responsable, notes |
| **Modifier le suivi** | Formulaire complet (voir [section 5.5](#55-modal-de-suivi-dun-mentorat)) |
| **Rencontres** | Consulter et ajouter des rencontres |
| **Clôturer / Arrêter** | Déclencher directement une clôture |

---

### 6.7 Valider ou rejeter une clôture

Mêmes actions que pour l'AP ([section 5.6](#56-valider-ou-rejeter-une-demande-de-clôture)), mais l'ACP peut agir sur **tous les mentorats de son pôle**, pas seulement ceux de son association.

---

### 6.8 Gestion des APs (animateurs)

**Menu :** "Gestion APs" → `/member/acp/animateurs`

#### Créer un animateur

1. Cliquer **"Nouvel animateur"**
2. Remplir : Prénom ✅, Nom ✅, Email ✅, Téléphone, Ville
3. Choisir l'association : **AGIR** / **ECTI** / **EGEE** / **OTECI**
4. Choisir le rôle : **AP** ou **ACP**
5. Valider

> ⚠️ Un **mot de passe temporaire** s'affiche **une seule fois** à la validation — à transmettre immédiatement à l'animateur. Il ne peut pas être récupéré après fermeture de la fenêtre.

#### Désactiver / Réactiver un animateur

| Action | Effet |
|--------|-------|
| **Désactiver** (icône ×) | Compte bloqué, données conservées |
| **Réactiver** (icône utilisateur+) | Accès rétabli immédiatement |

---

### 6.9 Gestion des établissements

Via la page Gestion APs, onglet **Établissements**.

- **Ajouter** : Nom + Code postal → l'établissement apparaît dans toutes les listes déroulantes des fiches jeunes du pôle
- **Désactiver** : l'établissement disparaît des listes mais les données historiques sont conservées

---

### 6.10 Annuaire Pôle

**Menu :** "Annuaire Pôle" → `/member/acp/annuaire`

Répertoire de tous les membres (AP, ACP, mentors) du pôle. Filtres par rôle et recherche textuelle.

---

### 6.11 KPIs du pôle

**Menu :** "KPIs Pôle" → `/member/pole/kpi`

Sélectionner la période : **6 mois / 12 mois / tout**.

Données disponibles :
- Demandes reçues et taux d'assignation
- Durée moyenne des mentorats
- Taux de clôture positive
- Répartition par diplôme, genre, situation

**Export PDF :** sélectionner les sections à inclure, puis générer.

---

## 7. Guide du CN — Coordination Nationale

### 7.1 Niveaux d'accès

| Accès | Pages disponibles |
| ----- | ----------------- |
| **Limité** (défaut) | Dashboard CN, Annuaire ORA, Implantations, KPIs nationaux |
| **Complet** | Tout + Gestion Mentors, Pôles, Animateurs, Configuration, Messages, Rétribution |

Le passage en accès complet se fait via **Configuration → Membres CN → toggle "Accès complet"**, par un membre CN déjà en accès complet.

---

### 7.2 Navigation CN

La navigation CN se répartit entre la **sidebar** (gauche) et le **header horizontal** (haut).

#### Sidebar — tous les membres CN

| Élément | Page |
|---------|------|
| Vue nationale | `/member/cn/dashboard` |
| Annuaire ORA | `/member/cn/annuaire` |
| Implantations | `/member/cn/implantations` |
| KPIs Nationaux | `/member/cn/kpis` |
| Icône clé (🔑) | Modal changement de mot de passe |

#### Sidebar — accès complet uniquement

| Élément | Page |
| ------- | ---- |
| Gestion mentors | `/member/cn/mentors` |
| Gestion pôles | `/member/cn/poles` |
| Gestion animateurs | `/member/cn/animateurs` |
| Configuration | `/member/cn/configuration` |

#### Header CN — navigation desktop (accès complet uniquement)

Le header CN en mode desktop offre un menu **"Administration"** avec les liens :

| Lien | Page |
|------|------|
| Rétribution | `/member/cn/retribution` |
| Mentors | `/member/cn/mentors` |
| Messages | `/member/cn/messages` *(badge non-lus)* |
| Pôles | `/member/cn/poles` |
| Animateurs | `/member/cn/animateurs` |
| Configuration | `/member/cn/configuration` |

---

### 7.3 Dashboard CN

**URL :** `/member/cn/dashboard`

Vue nationale synthétique :

- Total pôles actifs, mentors, mentorats actifs, jeunes en attente
- Répartition par association (AGIR / ECTI / EGEE / OTECI)
- Tableau récapitulatif par pôle : mentors, mentorats actifs, taux d'occupation

---

### 7.4 Annuaire ORA

**URL :** `/member/cn/annuaire`

Répertoire de tous les membres CN et animateurs (AP/ACP) de France.

Filtres : rôle, pôle, association, recherche texte (nom, email).

---

### 7.5 Implantations des pôles

**URL :** `/member/cn/implantations`

Carte interactive de France, colorisée par état d'activité :

| Couleur | État |
|---------|------|
| Bleu clair | À l'étude |
| Vert | Démarré |
| Jaune | Fragile |
| Violet | Expérimenté |
| Rouge | Arrêté |
| Gris | Non couvert |

Survol → tooltip avec infos du pôle · Clic → panneau détail · Filtres par état · Export PDF.

---

### 7.6 KPIs nationaux

**URL :** `/member/cn/kpis`

Vue nationale ou filtrée par pôle. Mêmes indicateurs que les KPIs de pôle, à l'échelle nationale. Export PDF.

---

### 7.7 Gestion nationale des mentors *(accès complet)*

**URL :** `/member/cn/mentors`

Liste de tous les mentors de France.

Filtres : pôle, association, statut.
Actions : voir profil complet, activer / désactiver.

---

### 7.8 Gestion des pôles *(accès complet)*

**URL :** `/member/cn/poles`

Liste de tous les pôles avec indicateurs.
Actions : créer, modifier (nom, code, état, départements couverts, contact), activer / désactiver.

---

### 7.9 Gestion nationale des animateurs *(accès complet)*

**URL :** `/member/cn/animateurs`

Créer un animateur à l'échelle nationale :

1. Cliquer **"Nouvel animateur"**
2. Saisir : Prénom, Nom, Email, Téléphone, Ville
3. Choisir : Pôle → Association → Rôle (AP ou ACP)
4. Valider

> ⚠️ Le mot de passe temporaire s'affiche **une seule fois** — à transmettre immédiatement.

---

### 7.10 Messages de contact *(accès complet)*

**URL :** `/member/cn/messages`

Messages reçus via le formulaire `/contact`. Non-lus affichés en premier, avec badge rouge dans le menu Administration. Possibilité de les marquer comme lus.

---

### 7.11 Rétribution *(accès complet)*

**URL :** `/member/cn/retribution`

Gestion des rétributions associées aux mentorats. Accessible depuis le menu **Administration** dans le header CN.

---

### 7.12 Configuration CN *(accès complet)*

**URL :** `/member/cn/configuration`

**Onglet "Membres CN" :**
- Tableau de tous les membres CN
- Toggles par membre : **Accès complet** · **Actif**

**Créer un membre CN :**
1. Prénom, Nom, Email, Téléphone, Ville
2. Fonction, Association, Pôle (optionnels)
3. Option **Super administrateur** → accès à `/admin/` Django
4. Valider → mot de passe temporaire affiché **une seule fois**

> Un membre CN ne peut pas se désactiver lui-même, ni modifier son propre accès complet.

**Onglet "Mon profil" :** modifier ses propres informations personnelles.

---

## 8. Cycle de vie d'un mentorat

```
[JEUNE]    Remplit /apprentis/inscription
                ↓
           Demande → statut NEW
           (pôle détecté automatiquement via code postal)
                ↓
[ACP]      Consulte la demande dans "Affectation"
           Algorithme de suggestions (score + distance km)
           Choisit un mentor + AP responsable → Confirmer
                ↓
           Mentorat créé → statut ACTIVE
           Demande → statut ASSIGNED
           Disponibilité mentor : -1
                ↓
[MENTOR]   Suit le jeune
           Enregistre ses rencontres
           Peut demander la clôture à tout moment
                ↓
           Demande de clôture soumise :
           Mentorat reste ACTIVE avec badge "En attente"
                ↓
[AP/ACP]   Reçoit la demande dans "Clôtures en attente"
           Peut modifier le message au jeune
           Confirme ou Rejette
                ↓
           Si confirmé :
           → Mentorat → CLOSED (normal) ou ABORTED (arrêt)
           → Disponibilité mentor : +1
           → Email envoyé au jeune avec lien d'évaluation unique
                ↓
[JEUNE]    Reçoit l'email → clique sur le lien unique
           Page /evaluer-mentor/:token (sans connexion)
           Note 1 à 5 étoiles + commentaire optionnel
                ↓
[MENTOR]   Voit l'évaluation dans son Bilan (étoiles + commentaire)
```

---

## 9. Système d'évaluation

### Pour le jeune

Après confirmation de clôture par l'AP/ACP, le jeune reçoit automatiquement un email avec un lien unique `/evaluer-mentor/:token`.

- Page accessible **sans connexion**
- **Note de 1 à 5 étoiles** (obligatoire)
- Commentaire libre (facultatif)
- Token **à usage unique** : désactivé après soumission

### Pour le mentor

Section **Bilan** du tableau de bord :
- Étoile(s) reçues pour chaque mentorat évalué
- Commentaire du jeune
- Date de soumission
- **Note moyenne globale** sur l'ensemble des évaluations reçues

---

## 10. Gestion des financements

### Création (CN complet uniquement)

Via l'administration Django (`/admin/`) → `Core > Financements`.

Deux types :
- **National** : visible dans tous les pôles
- **Local** : spécifique à un pôle

Champs : Nom, Code unique (ex : `CFA_ALTERNANCE`), Type.

### Utilisation (ACP)

Dans **Suivi mentorats → Modifier le suivi → section Financements** :

| Action | Comment |
|--------|---------|
| Voir | Liste des financements déjà attachés au mentorat |
| Ajouter | Sélectionner dans la liste nationale / locale |
| Supprimer | Retirer un financement du mentorat |

> Un même financement ne peut être attaché qu'**une seule fois** par mentorat.

---

## 11. Administration Django

**URL :** `/admin/`

Accessible uniquement aux comptes **Super administrateur** (`is_superuser = True`), accordé via **Configuration CN → Membres CN → Super administrateur**.

> Réservé à la maintenance technique. Pour les opérations courantes, utiliser les interfaces membres.

---

### 11.1 Gestion des comptes utilisateurs

**Section :** `Authentification et autorisation > Utilisateurs`

#### Réinitialiser un mot de passe

Via l'interface admin : ouvrir le compte → "Changer le mot de passe" → saisir deux fois → Enregistrer.

Via le shell (méthode rapide) :

```bash
# Depuis ora_backend/
python manage.py shell -c "
from django.contrib.auth import get_user_model
U = get_user_model()
u = U.objects.get(email='email@exemple.com')
u.set_password('NouveauMotDePasse!')
u.save()
print('Réinitialisé.')
"
```

#### Créer un compte pour un mentor sans compte

```bash
python manage.py shell -c "
from core.models import Mentor, User
m = Mentor.objects.get(email='email@exemple.com')
u = User.objects.create_user(
    email=m.email, password='MotDePasseTemp!',
    first_name=m.first_name, last_name=m.last_name
)
m.user = u
m.save(update_fields=['user'])
print('Compte créé.')
"
```

#### Vérifier les mentors sans compte

```bash
python manage.py shell -c "
from core.models import Mentor
for m in Mentor.objects.filter(user__isnull=True):
    print(m.first_name, m.last_name, m.email, 'actif=' + str(m.is_active))
"
```

---

### 11.2 Sections de l'administration

| Section | Contenu |
|---------|---------|
| `Core > Mentors` | Identité, localisation, pôle, association, capacité, formation, statut |
| `Core > Animateurs` | AP et ACP : identité, pôle, association, rôle (`is_coordinator`), statut |
| `Core > CN members` | Membres CN : identité, rôle, statut, accès complet, super admin |
| `Core > Poles` | Pôles : code, nom, statut, état, départements couverts, contact |
| `Core > Young requests` | Demandes jeunes : identité, localisation, formation, demande, statut |
| `Core > Mentorats` | Mentorats : relations, dates, statut, suivi, problématiques |
| `Core > Suivi mentorats` | Rencontres : date, durée, type, objectifs, notes |
| `Core > Etablissements` | CFA/écoles : nom, code postal, pôle, statut |
| `Core > Financements` | Financements : code, nom, type (national/local) |
| `Core > Contact messages` | Messages reçus via `/contact` |
| `Core > Matching decisions` | Audit des affectations : score, overridden |

---

### 11.3 États d'activité des pôles

| Code | Libellé affiché |
|------|----------------|
| `a_letude` | À l'étude |
| `demarre` | Démarré |
| `fragile` | Fragile |
| `experimente` | Expérimenté |
| `arrete` | Arrêté |

---

## 12. Design System

**URL :** `/charte`

Accessible via le lien **"Design System"** en bas du pied de page.

La charte graphique est une **page vivante** construite avec les composants ORA eux-mêmes. Elle sert de référentiel pour tout développement futur.

### Sections couvertes

| Section | Contenu |
|---------|---------|
| **Couleurs** | 6 couleurs de marque ORA + palette Slate + sémantique. Cliquer sur un swatch copie le hex. |
| **Typographie** | Police Open Sans, échelle de 10px à 64px, tokens tracking/leading |
| **Boutons** | Primaire, secondaire, ghost, désactivé, chargement, danger |
| **Badges & Pills** | Statuts mentorat, niveaux d'urgence (1–5), rôles, étoiles |
| **Cartes** | Standard, accent orange, statistique, témoignage |
| **Formulaires** | Input, select, textarea, radio cards, checkbox |
| **Icônes** | 7 tailles (10px–48px), 16 icônes clés du projet |
| **Alertes** | Succès, erreur, attention, information |
| **Layout** | Containers, espacements, grilles responsives, border-radius |

### Exporter la charte en PDF

1. Aller sur `/charte`
2. Cliquer **"Exporter en PDF"** (bouton en haut à droite du héro)
3. Dans la boîte d'impression : choisir **"Enregistrer en PDF"** — Format A4

> Lors de l'impression : sidebar et header/footer masqués, chaque section commence sur une nouvelle page, les couleurs de fond sont préservées.

---

## Annexe — Référence des statuts

### Demande jeune (`YoungRequest`)

| Statut | Description |
|--------|-------------|
| `NEW` | Demande reçue, non encore traitée |
| `PENDING` | En cours d'étude par l'ACP |
| `ASSIGNED` | Mentor affecté, mentorat créé |
| `CLOSED` | Demande archivée |

### Mentorat

| Statut | Description |
|--------|-------------|
| `PENDING` | Créé mais pas encore démarré |
| `ACTIVE` | En cours (inclut les demandes de clôture "en attente") |
| `CLOSED` | Terminé normalement |
| `ABORTED` | Interrompu avant la fin |

### Pôle

| Statut | Description |
|--------|-------------|
| `ACTIVE` | Pôle opérationnel |
| `INACTIVE` | Pôle suspendu |

---

*Manuel mis à jour le 2026-05-14 — Plateforme ORA*
*Vérifié sur la base du code source (App.tsx, Sidebar.tsx, HeaderCN.tsx, Home.tsx, Footer.tsx, Header.tsx, APDashboard.tsx, MentorDashboard.tsx, ACPDashboard.tsx)*
