# Manuel d'utilisation — Plateforme ORA

> **ORA** (Objectif Réussir l'Apprentissage) est une plateforme de gestion du mentorat pour apprentis.
> Elle connecte des jeunes en apprentissage avec des mentors bénévoles, encadrés par des animateurs de pôle.

---

## Table des matières

1. [Vue d'ensemble des rôles](#1-vue-densemble-des-rôles)
2. [Site public — Pages et navigation](#2-site-public--pages-et-navigation)
3. [Connexion et navigation membre](#3-connexion-et-navigation-membre)
4. [Rôle Mentor](#4-rôle-mentor)
5. [Rôle AP — Animateur de Pôle](#5-rôle-ap--animateur-de-pôle)
6. [Rôle ACP — Animateur Coordinateur de Pôle](#6-rôle-acp--animateur-coordinateur-de-pôle)
7. [Rôle CN — Coordination Nationale](#7-rôle-cn--coordination-nationale)
8. [Cycle de vie complet d'un mentorat](#8-cycle-de-vie-complet-dun-mentorat)
9. [Système d'évaluation](#9-système-dévaluation)
10. [Gestion des financements](#10-gestion-des-financements)
11. [Administration Django](#11-administration-django)

---

## 1. Vue d'ensemble des rôles

| Rôle | Qui ? | Responsabilités principales |
|------|-------|-----------------------------|
| **Jeune (public)** | Apprenti ou chercheur d'apprentissage | S'inscrire, évaluer son mentor |
| **Mentor** | Professionnel bénévole | Suivre ses jeunes en mentorat |
| **AP** | Animateur de Pôle | Encadrer les mentors, valider les clôtures |
| **ACP** | Animateur Coordinateur de Pôle | Affectation, suivi global du pôle, KPIs. **Hérite aussi des droits AP** : peut valider des clôtures et suivre les mentors de son association. |
| **CN (limité)** | Membre CN lecture seule | Consulter les données nationales |
| **CN (complet)** | Membre CN admin | Gérer mentors, pôles, animateurs, membres CN |

> **Périmètre des données :**
> - L'**AP** voit les mentors de **son association dans son pôle** uniquement.
> - L'**ACP** voit tous les mentors et mentorats de **son pôle** (toutes associations confondues).
> - La **CN** voit l'ensemble du territoire national.

---

## 2. Site public — Pages et navigation

### 2.1 Navigation principale

La barre de navigation (en haut de toutes les pages publiques) contient :

| Lien | URL | Description |
|------|-----|-------------|
| Logo ORA | `/` | Retour à l'accueil |
| ORA c'est quoi ? | `/ora` | Présentation de l'association |
| Je suis apprenti(e) | `/apprentis` | Informations pour les jeunes |
| Devenir mentor | `/mentors` | Informations pour les mentors bénévoles |
| **Mon espace** *(si connecté)* | dashboard selon rôle | Accès à l'espace membre |
| **Connexion** *(si non connecté)* | `/login` | Page de connexion |

---

### 2.2 Page d'accueil

**URL :** `/`

La page d'accueil se compose des sections suivantes, dans cet ordre :

#### Section Hero
Bandeau avec fond dégradé bleu marine foncé, accroche principale **"Quelqu'un a envie de te voir réussir."** et sous-titre de présentation d'ORA. Badge de confiance affiché (ex: "1 200+ jeunes accompagnés").

#### Section "Trois portes" (entrées principales)
Trois cartes d'entrée positionnées juste sous le Hero :

| Carte | Couleur | Public | Bouton(s) |
|-------|---------|--------|-----------|
| **Trouver mon Alternance** | Orange | Jeune en recherche de contrat | "ME FAIRE ACCOMPAGNER" → `/apprentis/inscription` |
| **Je suis Apprenti(e)** | Corail | Jeune déjà en apprentissage | "M'INSCRIRE MAINTENANT" → `/apprentis/inscription` |
| **CFA, Greta, Mentors…** | Bleu | Institutions et mentors bénévoles | "Devenir Mentor" → `/mentors/inscription` + "Contact Institutionnel" → `/contact` |

> Les deux premières cartes redirigent vers le même formulaire d'inscription jeune.

#### Section Statistiques (première occurrence)
4 chiffres clés affichés dynamiquement (alimentés en temps réel depuis la base de données) :
- 6 000+ jeunes accompagnés
- 3 000+ mentors bénévoles
- Nombre de départements couverts (mis à jour dynamiquement)
- Nombre de pôles actifs (mis à jour dynamiquement)

#### Section "Pourquoi choisir ORA ?"
3 arguments illustrés par des icônes Lucide :
- **Zéro Décrochage** (icône ShieldCheck)
- **Réussite Diplômante** (icône GraduationCap)
- **Confiance Boostée** (icône TrendingUp)

#### Section "Nos valeurs"
4 valeurs présentées en grille 2×2 de cartes horizontales avec icône colorée et fond teinté :
- **Bienveillant** (fond bleu clair)
- **Confidentiel** (fond violet clair)
- **Sur-mesure** (fond orange clair)
- **100% Gratuit** (fond vert clair)

#### Section "Présents sur tout le territoire"
Bloc dégradé sombre avec chiffres clés (départements couverts, pôles actifs, associations partenaires) et texte descriptif + bouton "Voir nos implantations" → `/implantations`.

#### Section Témoignages
3 cartes de témoignages (Léa — apprentie, Michel — mentor, Thomas — apprenti) avec badges de rôle colorés. Lien **"Voir tous les témoignages"** → `/temoignages`.

#### Section Statistiques "ORA en chiffres" (deuxième occurrence — bas de page)
Répétition condensée des 4 chiffres clés. La mention "ORA en chiffres" est positionnée **sous** les compteurs.

---

### 2.3 Pages d'information publiques

| Page | URL | Contenu |
|------|-----|---------|
| À propos d'ORA | `/ora` | Présentation, histoire, missions de l'association |
| Je suis apprenti(e) | `/apprentis` | Comment fonctionne l'accompagnement, FAQ courte |
| Devenir mentor | `/mentors` | Rôle du mentor, engagement, avantages |
| FAQ | `/faq` | Questions fréquentes |
| Témoignages | `/temoignages` | Témoignages de jeunes et de mentors |
| Partenaires | `/partenaires` | Liste des partenaires institutionnels |
| Implantations | `/implantations` | Carte des pôles en France |
| Actualités | `/actualites` | Articles et news |
| Contact | `/contact` | Formulaire de contact |

---

### 2.4 Inscription jeune — Formulaire de demande de mentorat

**URL :** `/apprentis/inscription`

Accessible depuis les deux premières cartes de l'accueil ou directement.

#### Structure du formulaire

Le formulaire est divisé en 5 sections :

---

**Section 1 — Identité**

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Prénom | ✅ | |
| Nom | ✅ | |
| Email | ✅ | Utilisé pour les communications |
| Téléphone | Non | |
| Date de naissance | Non | |
| Genre | Non | Garçon / Fille / Autre / Non précisé |

---

**Section 2 — Localisation**

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| **Code postal** | ✅ | 5 chiffres. Dès la saisie complète, le pôle ORA correspondant est **automatiquement détecté** |
| **Commune** | ✅ | Nom de la ville, utilisé pour le matching géographique avec les mentors |

> **Détection automatique du pôle :** dès que le code postal est complet (5 chiffres), le système identifie le pôle ORA couvrant ce département et affiche un **bandeau vert** confirmant le pôle détecté. La demande sera automatiquement transmise à ce pôle. Le jeune n'a pas à choisir manuellement son pôle.
>
> Si aucun pôle ne couvre le département, un **bandeau orange** s'affiche avec l'invitation à contacter ORA par email ou via le formulaire de contact. Le formulaire ne peut pas être soumis dans ce cas.

---

**Section 3 — Scolarité**

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| **Diplôme préparé** | Non | Menu déroulant groupé par niveau : |
| | | Niveau 3 : CAP, BEP |
| | | Niveau 4 : Bac Professionnel, Bac (autre), Brevet Professionnel |
| | | Niveau 5 : BTS, DUT |
| | | Niveau 6 : Licence Professionnelle, BUT |
| | | Niveau 7 : Master, DEA, DES, Ingénieur |
| **Situation actuelle** | ✅ | Deux boutons radio : **Déjà en apprentissage** / **En recherche d'apprentissage** |
| **Nom de l'école / CFA** | Non | Champ texte libre — affiché **uniquement** si la situation est "Déjà en apprentissage" |

---

**Section 4 — Ta demande**

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| **Exprime ta demande** | ✅ | Zone de texte libre (5 lignes). Le jeune décrit ce sur quoi il souhaite être accompagné (difficultés avec l'employeur, dossier professionnel, orientation…) |

---

**Section 5 — Confidentialité**

Case à cocher obligatoire : *"J'accepte que mes données personnelles soient utilisées pour me mettre en relation avec un mentor. Mes données resteront confidentielles et ne seront pas partagées avec des tiers."*

Bouton **"Envoyer ma demande"** (désactivé tant que la case n'est pas cochée ou qu'aucun pôle n'est détecté).

#### Après l'envoi
Un écran de confirmation s'affiche : *"Inscription envoyée ! Nous allons étudier ta demande et te recontacter très prochainement."* La demande apparaît dans le tableau de bord ACP du pôle détecté avec le statut **NOUVEAU**.

---

### 2.5 Candidature mentor

**URL :** `/mentors/inscription`

Accessible depuis la troisième carte de l'accueil ou via la page "Devenir mentor".

> **Important :** Ce formulaire est une **candidature**, pas une création de compte. L'animateur ORA du pôle examinera la candidature et contactera le candidat pour finaliser l'inscription. Aucun compte n'est créé à cette étape.

#### Structure du formulaire — 4 étapes

**Étape 1 — Votre localisation**

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Code postal | ✅ | Détection automatique du pôle (même mécanisme que l'inscription jeune) |
| Commune | Non | Nom de la ville |

---

**Étape 2 — Votre association**

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Association | ✅ | Choix parmi les 4 associations nationales : AGIR, ECTI, EGEE, OTECI |

---

**Étape 3 — Vos informations**

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Prénom | ✅ | |
| Nom | ✅ | |
| Email | ✅ | |
| Téléphone | Non | |

---

**Étape 4 — Votre profil mentor**

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Expérience professionnelle | ✅ | Zone de texte libre — décrire son parcours |
| Domaines d'expertise | ✅ | Cases à cocher (au moins 1 requis) : Commerce/Vente, Industrie, Artisanat, Services, Santé/Social, Informatique/Numérique, Hôtellerie/Restauration, BTP, Transport/Logistique, Agriculture, Autre |
| Disponibilité | Non | 1 fois/semaine, 2 fois/mois, 1 fois/mois, Flexible |
| Motivation | Non | Zone de texte libre |

#### Après l'envoi
Écran de confirmation : *"Candidature envoyée ! L'animateur de votre association vous contactera prochainement."*

---

### 2.6 Formulaire de contact

**URL :** `/contact`

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Nom complet | ✅ | |
| Email | ✅ | |
| Téléphone | Non | |
| Sujet | ✅ | Je suis apprenti(e) / Je veux devenir mentor / Partenariat / Presse-Média / Autre |
| Message | ✅ | Zone de texte libre |

Les messages reçus sont consultables par la CN dans l'espace membre (page **CN Messages**) et dans l'administration Django.

---

### 2.7 Bandeau de consentement cookies (RGPD)

Un bandeau de consentement s'affiche automatiquement sur **toutes les pages publiques** lors de la première visite (après un délai de 800 ms).

**Contenu :**
- Explication que le site utilise uniquement des cookies **techniques essentiels** (authentification, session) — aucun cookie publicitaire ou de traçage tiers
- Badge de conformité RGPD : "Conforme RGPD · Aucun traçage tiers"
- Bouton **"J'accepte"** — enregistre le consentement dans le navigateur (`localStorage`)
- Lien **"En savoir plus"** → `/politique-confidentialite`
- Bouton de fermeture (×) — ferme le bandeau sans action

> **Persistance :** une fois accepté ou fermé, le bandeau ne réapparaît plus (consentement stocké sous la clé `ora_cookie_consent`). Pour réinitialiser en développement : supprimer cette clé dans le `localStorage` du navigateur.

---

### 2.8 Page d'évaluation (lien reçu par email)

**URL :** `/evaluer-mentor/:token`

Page publique accessible sans connexion, via le lien unique reçu par email après la clôture d'un mentorat. Voir [section 9](#9-système-dévaluation).

---

---

## 3. Connexion et navigation membre

### 3.1 Connexion

**URL :** `/login`

- Saisir **email** et **mot de passe**
- Lors de la première connexion, utiliser le **mot de passe temporaire** communiqué par l'administrateur

### 3.2 Redirection selon le rôle

Après connexion, chaque utilisateur est redirigé automatiquement vers son espace :

| Rôle | Page d'atterrissage |
|------|---------------------|
| MENTOR | `/member/mentor/dashboard` |
| AP | `/member/ap/dashboard` |
| ACP | `/member/acp/dashboard` |
| CN | `/member/cn/dashboard` |

> **Utilisateurs multi-rôles (ACP+AP, ACP+AP+Mentor) :** un ACP hérite automatiquement des droits AP. Dans la barre latérale, un **sélecteur de rôle** permet de basculer entre les vues disponibles (ex : "ACP", "AP", "Mentor"). L'ACP peut accéder à la **Vue Animateur** (tableau de bord AP) via le menu latéral sans changer de compte.

### 3.3 Mot de passe oublié

Il n'existe pas de page de réinitialisation en libre-service. Un administrateur (CN ou ACP) doit réinitialiser le mot de passe manuellement via l'administration Django. Voir [section 11.1](#111-comptes-utilisateurs).

### 3.4 Déconnexion

Bouton **Déconnexion** dans la barre de navigation de l'espace membre.

---

## 4. Rôle Mentor

### Navigation disponible
- **Mes mentorats** — tableau de bord avec tous les mentorats

---

### 4.1 Tableau de bord Mentor — Statistiques

En haut de la page, 4 indicateurs :

| Indicateur | Description |
|-----------|-------------|
| **Mentorats actifs** | Nombre de jeunes actuellement suivis |
| **Places disponibles** | Capacité restante (`disponibilite_reelle`) |
| **Mentorats terminés** | Nombre de mentorats clôturés normalement |
| **Note moyenne** | Moyenne des évaluations reçues (si au moins une évaluation) |

---

### 4.2 Liste des mentorats actifs

Chaque mentorat actif est présenté sous forme de carte avec :
- Prénom et nom du jeune, établissement, diplôme préparé, situation
- AP responsable du suivi
- Date de début
- Indicateur de dernière activité (vert / orange / rouge selon le délai d'inactivité)

**Actions disponibles sur chaque carte :**

| Bouton | Description |
|--------|-------------|
| **Modifier infos jeune** | Mettre à jour l'établissement du jeune (liste du pôle ou saisie libre) |
| **Enregistrer une rencontre** | Ajouter une entrée de suivi (date, durée, type, objectifs, notes) |
| **Clôturer / Arrêter** | Soumettre une demande de clôture (nécessite validation AP/ACP) |

---

### 4.3 Modifier les informations du jeune

| Champ | Description |
|-------|-------------|
| Établissement | Sélection dans la liste du pôle ou option "Autre" |
| Nom libre | Si "Autre" sélectionné : saisie libre du nom de l'établissement |

---

### 4.4 Enregistrer une rencontre

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Date de rencontre | ✅ | Date effective du contact |
| Durée | Non | En minutes |
| Type de rencontre | Non | Présentiel / Téléphone / Visio / Autre |
| Objectifs atteints | Non | Oui / Non / Partiellement |
| Notes | Non | Compte-rendu libre |

> Enregistrer une rencontre met à jour la date de **dernier contact**, ce qui réinitialise le compteur d'inactivité visible par l'AP et l'ACP.

---

### 4.5 Demander la clôture d'un mentorat

1. Cliquer **Clôturer** (fin normale) ou **Arrêter** (interruption)
2. Saisir une **raison obligatoire**
3. Confirmer

> La demande ne prend pas effet immédiatement. Le mentorat reste **ACTIVE** mais passe en état "en attente de confirmation". Un badge "En attente de validation" apparaît sur la carte. L'AP ou l'ACP doit valider.

---

### 4.6 Historique et évaluations reçues (Bilan)

Section **Bilan** en bas du tableau de bord :
- Liste de tous les mentorats clôturés avec date et raison de clôture
- Pour chaque mentorat évalué : note en étoiles (1 à 5) et commentaire du jeune
- Note moyenne globale sur tous les mentorats évalués

---

## 5. Rôle AP — Animateur de Pôle

### Navigation disponible
- **Tableau de bord** — vue de son association dans son pôle
- **Gestion mentors** — liste détaillée des mentors

> **Périmètre :** l'AP voit uniquement les mentors de **son association dans son pôle**. Il ne voit pas les mentors des autres associations du même pôle, ni les mentors de son association dans d'autres pôles.

---

### 5.1 Statistiques du tableau de bord AP

| Indicateur | Description |
|-----------|-------------|
| **Mentors (asso.)** | Total de mentors actifs dans l'association au sein de ce pôle |
| **Mes mentorats** | Mentorats actifs dont cet AP est l'AP responsable |
| **Actifs (asso.)** | Total des mentorats actifs dans l'association |
| **Alertes rouges** | Mentorats avec le flag d'alerte rouge activé |
| **Inactivité +30j** | Mentors sans aucun contact enregistré depuis plus de 30 jours |
| **Dispo.** | Nombre de places disponibles dans l'association |

> **Compteur inactivité :** un mentor est compté comme inactif si ni une rencontre SuiviMentorat ni un champ `dernier_contact` sur un mentorat actif ne date de moins de 30 jours. Enregistrer une rencontre ou mettre à jour le dernier contact fait immédiatement disparaître ce mentor du compteur.

---

### 5.2 Liste des mentors

La liste des mentors de l'association est triée automatiquement : alertes d'abord, avertissements ensuite, actifs en dernier.

**Indicateurs de dernière activité :**
- 🔴 **Alerte** — inactif depuis plus de 30 jours
- 🟡 **Avertissement** — inactif depuis 15 à 30 jours
- 🟢 **OK** — activité récente (moins de 15 jours)

**Cliquer sur un mentor** ouvre un panneau détaillé :
- Informations personnelles (email, téléphone, ville)
- Mentorats actifs et état de chaque suivi
- Historique des rencontres enregistrées
- Possibilité d'envoyer un message de relance
- Boutons d'action pour chaque mentorat actif (voir ci-dessous)

---

### 5.3 Actions sur les mentorats actifs

Pour chaque mentorat actif, trois boutons sont disponibles depuis le tableau de bord :

| Bouton | Icône | Description |
|--------|-------|-------------|
| **Modifier le suivi** | Presse-papiers | Formulaire complet : problématiques, alertes, infos jeune, dates, notes |
| **Rencontres** | Calendrier | Consulter et ajouter des rencontres SuiviMentorat |
| **Clôturer / Arrêter** | Cadenas | Déclencher directement une clôture (sans passer par le mentor) |

---

### 5.4 Formulaire "Modifier le suivi" — détail complet

**Problématiques identifiées** (cases à cocher, sélection multiple) :

| Code | Libellé |
|------|---------|
| aide_informatique | Aide informatique |
| fle | Apprentissage du français (FLE) |
| changer_employeur | Changer d'employeur |
| handicap | Handicap |
| logement | Logement |
| orientation | Orientation |
| prob_administratif | Problème administratif |
| prob_financier | Problème financier — Gérer Budget |
| fragilite_mentale | Fragilité mentale |
| prep_dossier | Prép dossier professionnel |
| relation_employeur | Relation avec l'employeur |
| recherche_contrat | Recherche contrat apprentissage |
| salaire | Salaire / Respect de convention |
| soutien_moral | Soutien moral |
| soutien_scolaire | Soutien scolaire |
| autre | Autre |

**Dates & Alertes :**

| Champ | Description |
|-------|-------------|
| Alerte rouge | Cocher pour marquer le mentorat comme urgent (apparaît en rouge dans toutes les vues) |
| Dernier contact | Date du dernier contact saisie manuellement |
| Date de fin prévue | Date prévisionnelle de fin de mentorat |

**Informations du jeune :**

| Champ | Description |
|-------|-------------|
| Établissement | Sélection dans la liste du pôle ou "Autre" |
| Diplôme préparé | Mise à jour (13 options groupées par niveau) |
| Date de naissance | Correction si nécessaire |
| Genre | Garçon / Fille / Autre |
| Niveau d'urgence | 1 (Faible) / 2 (Moyen) / 3 (Urgent) |

**Notes de suivi :** champ texte libre, visible par AP et ACP.

---

### 5.5 Section "Clôtures en attente" ⚠️

Cette section apparaît automatiquement dès qu'un mentor soumet une demande de clôture pour un mentorat dont cet AP est responsable.

Pour chaque demande :
- Nom du mentor et du jeune
- Action demandée (Clôturer / Arrêter) et raison fournie

| Bouton | Effet |
|--------|-------|
| **Confirmer** | Clôture effective. Statut → CLOSED ou ABORTED. Disponibilité mentor incrémentée. Email envoyé au jeune avec lien d'évaluation unique. |
| **Rejeter** | Demande annulée. Le mentorat redevient pleinement actif. Le mentor peut soumettre une nouvelle demande. |

---

## 6. Rôle ACP — Animateur Coordinateur de Pôle

### Navigation disponible
- **Dashboard** — vue globale du pôle
- **Affectation** — affecter les mentors aux demandes (anciennement "Matching")
- **KPIs** — indicateurs de performance
- **Suivi mentorats** — gestion de tous les mentorats du pôle
- **Gestion** — animateurs et établissements
- **Vue Animateur** *(lien vers `/member/ap/dashboard`)* — accéder à la vue AP sans changer de rôle

> **Périmètre :** l'ACP voit **tous** les mentors et mentorats de son pôle, toutes associations confondues.
>
> **Multi-rôle :** un ACP hérite des droits AP. Il peut valider des clôtures, suivre les mentors de son association, et être désigné comme AP responsable d'un mentorat.

---

### 6.1 Statistiques du dashboard ACP

| Indicateur | Description |
|-----------|-------------|
| **Associations** | Nombre d'associations dans le pôle + nombre d'AP actifs |
| **Mentors** | Total mentors actifs + nombre disponibles |
| **Mentorats actifs** | Total des mentorats en cours |
| **Alertes rouges** | Mentorats avec alerte activée |
| **Inactivité +30j** | Mentors sans contact depuis plus de 30 jours (tout le pôle) |
| **Dispo.** | Nombre total de places disponibles dans le pôle |
| **Demandes** | Demandes en attente de matching |
| **Animateurs** | Nombre d'AP/ACP actifs dans le pôle |

Le dashboard affiche aussi un **tableau par association** : nb mentors, mentorats actifs, alertes rouges, inactifs, disponibilités pour chaque association du pôle.

---

### 6.2 Affectation

Fonctionnalité centrale pour affecter un mentor à une demande de jeune (accessible via le menu **Affectation**).

#### Étape 1 — Sélectionner une demande
Liste des demandes en statut **NOUVEAU** ou **EN ATTENTE** dans le pôle, avec : nom du jeune, diplôme, situation, commune/CP, date, urgence.

#### Étape 2 — Suggestions de mentors
Algorithme de score automatique pour chaque mentor disponible du pôle :

| Critère | Points |
|---------|--------|
| Places disponibles | `disponibilite_reelle × 25` (max 75) |
| Distance ≤ 10 km | +80 |
| Distance ≤ 30 km | +60 |
| Distance ≤ 60 km | +40 |
| Distance > 60 km | +10 |
| Mentor formé | +15 |
| Expérience (mentorats terminés) | `nb × 3` (max 30) |

Chaque suggestion affiche un badge de **distance en km** coloré selon la proximité. Les 10 meilleurs mentors sont listés, triés par score décroissant.

**Codes couleur du score :**
- 🟣 ≥ 120 pts — Excellent
- 🟢 ≥ 80 pts — Bon
- ⚫ < 80 pts — Acceptable

#### Étape 3 — Confirmer l'affectation
1. Cliquer sur le mentor choisi
2. Optionnel : sélectionner l'**animateur responsable** dans le sélecteur "Animateur accompagnateur" — la liste inclut les AP **et** les ACP du pôle, chacun identifié par un badge coloré (violet = ACP, bleu ciel = AP)
3. Optionnel : justification si le choix diffère de la suggestion n°1
4. Cliquer **Confirmer l'affectation**

Résultat : mentorat créé (statut ACTIVE), demande → ASSIGNED, animateur responsable désigné (AP ou ACP selon disponibilité).

#### Rerouter une demande
Si la demande ne peut être traitée dans ce pôle :
1. Ouvrir la demande → **Rerouter**
2. Sélectionner le pôle de destination → Confirmer

La demande disparaît de ce pôle et apparaît dans le pôle destinataire.

---

### 6.3 Suivi des mentorats

Vue de tous les mentorats du pôle, filtrables par statut (ACTIF, CLÔTURÉ, ARRÊTÉ, EN ATTENTE).

#### Boutons d'action sur les mentorats ACTIFS

| Bouton | Icône | Description |
|--------|-------|-------------|
| **Modifier** | Crayon | Modal de gestion administrative : statut, mentor, pôle, AP responsable, notes |
| **Modifier le suivi** | Presse-papiers | Formulaire complet de suivi (problématiques, alertes, infos jeune, dates, financements) |
| **Rencontres** | Calendrier | Consulter et ajouter des rencontres SuiviMentorat |
| **Clôturer / Arrêter** | Cadenas | Déclencher directement une clôture |

#### Modal "Modifier" — champs disponibles

| Champ | Description |
|-------|-------------|
| Statut | PENDING / ACTIVE / CLOSED / ABORTED |
| Mentor assigné | Changer le mentor (liste des mentors du pôle) |
| Pôle responsable | Transférer à un autre pôle |
| AP responsable | Changer l'AP en charge |
| Notes de suivi | Notes internes |

#### Confirmer/Rejeter une clôture
Mêmes effets que pour l'AP (section 5.5), mais l'ACP peut agir sur **tous les mentorats de son pôle**, pas seulement ceux de son association.

---

### 6.4 Gestion des animateurs

#### Créer un animateur
1. **Nouvel animateur**
2. Prénom, nom, email, téléphone, ville
3. Association (AGIR / ECTI / EGEE / OTECI)
4. Rôle (AP ou ACP)
5. Valider → mot de passe temporaire affiché **une seule fois** — à transmettre immédiatement

#### Désactiver / Réactiver
| Action | Effet |
|--------|-------|
| Désactiver (icône ×) | Compte bloqué, données conservées |
| Réactiver (icône utilisateur+) | Accès rétabli immédiatement |

---

### 6.5 Gestion des établissements

Liste des établissements (écoles, CFA) référencés dans le pôle.

- **Ajouter** : nom + code postal → apparaît dans toutes les listes déroulantes des fiches jeunes
- **Désactiver** : l'établissement disparaît des listes mais les données historiques sont conservées

---

### 6.6 KPIs du pôle

Choix de période : 6 mois / 12 mois / tout.

Données : demandes reçues, taux d'assignation, durée moyenne de mentorat, taux de clôture positive, répartition par diplôme / genre / situation.

**Export PDF** : sélection des sections à inclure.

---

## 7. Rôle CN — Coordination Nationale

### Niveaux d'accès

| Accès | Pages disponibles |
|-------|-------------------|
| **Limité** | Dashboard CN, Annuaire ORA, Implantations, KPIs nationaux |
| **Complet** | Tout + Mentors, Pôles, Animateurs, Messages, Configuration CN |

> Le passage en accès complet se fait via **Configuration → Membres CN → toggle "Accès complet"**, par un membre CN déjà avec accès complet.

---

### 7.1 Dashboard CN

Vue nationale synthétique : total pôles, mentors, mentorats actifs, jeunes en attente. Répartition par association. Tableau récapitulatif par pôle.

---

### 7.2 Annuaire ORA *(accès limité et complet)*

Répertoire de tous les membres CN et animateurs (AP/ACP) de France.

Filtres : rôle, pôle, association, recherche texte (nom, email).

---

### 7.3 Implantations des pôles *(accès limité et complet)*

Carte interactive de France colorisée par état d'activité :

| Couleur | État |
|---------|------|
| Bleu clair | À l'étude |
| Vert | Démarré |
| Jaune | Fragile |
| Violet | Expérimenté |
| Rouge | Arrêté |
| Gris | Non couvert |

**Interactions :** survol → tooltip, clic → panneau détail du pôle, filtres par état, export PDF.

---

### 7.4 KPIs nationaux *(accès limité et complet)*

Vue nationale globale ou par pôle (sélecteur). Données : volume de demandes, taux de traitement, durées moyennes, répartitions, tableau comparatif des pôles. Export PDF.

---

### 7.5 Gestion nationale des mentors *(accès complet)*

Liste de tous les mentors de France. Filtres : pôle, association, statut.

Actions : voir profil complet, activer/désactiver.

---

### 7.6 Gestion des pôles *(accès complet)*

Liste de tous les pôles avec indicateurs. Actions : créer, modifier (nom, code, état, départements, contact), activer/désactiver.

---

### 7.7 Gestion nationale des animateurs *(accès complet)*

Même fonctionnement que la gestion ACP, à l'échelle nationale.

Créer un animateur :
1. Nouvel animateur
2. Prénom, nom, email, téléphone, ville
3. Pôle → association → rôle (AP ou ACP)
4. Valider → mot de passe temporaire affiché **une seule fois**

---

### 7.8 Messages de contact *(accès complet)*

Tous les messages reçus via le formulaire de contact public `/contact`, triés avec les non-lus en premier. Possibilité de les marquer comme lus.

---

### 7.9 Configuration CN *(accès complet)*

**Onglet "Membres CN"**

Tableau de tous les membres CN avec toggles :
- **Accès complet** — donne accès aux pages de gestion CN
- **Actif** — active/désactive le compte

**Ajouter un membre CN :**
1. Prénom, nom, email, téléphone, ville
2. Fonction, association, pôle de rattachement (optionnels)
3. Option **Super administrateur** — donne accès à l'interface `/admin/` Django
4. Valider → mot de passe temporaire affiché **une seule fois**

> Un membre CN ne peut pas se désactiver lui-même ni modifier son propre accès complet.

**Onglet "Mon profil"** — chaque membre CN peut modifier ses propres informations (prénom, nom, téléphone, ville, fonction, association, pôle).

---

## 8. Cycle de vie complet d'un mentorat

```
[JEUNE]   Remplit le formulaire /apprentis/inscription
               ↓
          Demande créée → statut : NOUVEAU
          (pôle détecté automatiquement par code postal)
               ↓
[ACP]     Consulte les demandes dans Affectation
          Lance l'algorithme de suggestions (score + distance)
          Choisit un mentor → Confirmer l'affectation
               ↓
          Mentorat créé → statut : ACTIVE
          Demande → statut : ASSIGNED
          Disponibilité mentor décrémentée de 1
          AP responsable auto-assigné
               ↓
[MENTOR]  Suit le jeune (rencontres, infos)
          Peut demander la clôture à tout moment
               ↓
          Demande de clôture :
          Mentorat reste ACTIVE mais "en attente"
               ↓
[AP/ACP]  Valide ou rejette la demande
               ↓
          Si confirmé :
          → Mentorat → CLOSED (normal) ou ABORTED (arrêt)
          → Disponibilité mentor incrémentée de 1
          → Email envoyé au jeune avec lien d'évaluation unique
          → Token d'évaluation créé (usage unique)
               ↓
[JEUNE]   Clique sur le lien email
          Page /evaluer-mentor/:token (sans connexion requise)
          Note 1 à 5 étoiles + commentaire optionnel
               ↓
[MENTOR]  Voit l'évaluation dans son Bilan
```

---

## 9. Système d'évaluation

### Pour le jeune
Après confirmation de clôture, le jeune reçoit un email avec un **lien unique** vers `/evaluer-mentor/:token` (sans connexion).

- Note de **1 à 5 étoiles**
- Commentaire libre (optionnel)

> Le token est à usage unique. Une fois soumis, le lien ne fonctionne plus.

### Pour le mentor
Section **Bilan** du tableau de bord : note reçue (étoiles ★), commentaire du jeune, date de soumission, note moyenne globale.

---

## 10. Gestion des financements

### Création
Uniquement par les membres **CN avec accès complet**, via l'administration Django (`/admin/`).

Deux types : **Local** (spécifique à un pôle) / **National** (tous pôles).

### Utilisation
L'**ACP** attache les financements aux mentorats dans **Suivi mentorats → Modifier le suivi → section Financements**.

| Action | Description |
|--------|-------------|
| Voir | Liste des financements attachés avec leur code |
| Ajouter | Sélectionner parmi la liste nationale |
| Supprimer | Retirer un financement |

> Un même financement ne peut être ajouté qu'une seule fois par mentorat.

---

## 11. Administration Django

**URL :** `/admin/`

Accessible uniquement aux comptes avec **Super administrateur** (`is_superuser=True`), accordé via Configuration CN.

> Réservé à la maintenance technique. Pour les opérations courantes, utiliser les interfaces membres dédiées.

---

### 11.1 Comptes utilisateurs

**Section :** `Authentification et autorisation > Utilisateurs`

| Colonne | Description |
|---------|-------------|
| Email | Identifiant de connexion (unique) |
| Nom complet | Prénom + Nom |
| Staff | Accès à l'interface admin Django |
| Superuser | Accès complet à l'admin |
| Actif | Si décoché : compte bloqué |

**Réinitialiser un mot de passe :**
- Via l'admin : ouvrir le compte → "Changer le mot de passe" → saisir deux fois le nouveau mot de passe → Enregistrer
- Via le shell Django (méthode rapide) :

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

**Créer un compte pour un mentor sans compte** (`user=None`) :

```bash
python manage.py shell -c "
from core.models import Mentor, User
m = Mentor.objects.get(email='email@exemple.com')
u = User.objects.create_user(email=m.email, password='MotDePasseTemp!', first_name=m.first_name, last_name=m.last_name)
m.user = u
m.save(update_fields=['user'])
print('Compte créé.')
"
```

**Vérifier les mentors sans compte :**

```bash
python manage.py shell -c "
from core.models import Mentor
sans_compte = Mentor.objects.filter(user__isnull=True)
for m in sans_compte:
    print(m.first_name, m.last_name, m.email, 'actif=' + str(m.is_active))
"
```

---

### 11.2 Mentors

**Section :** `Core > Mentors`

Liste avec : nom, pôle, association, disponibilité, capacité, formation, statut.

Filtres : pôle, association, actif/inactif, formé/non formé.

**Fiche mentor :**

| Section | Champs |
|---------|--------|
| Informations | Compte lié (`user`), prénom, nom, email, téléphone |
| Localisation | Ville, code postal, département |
| Organisation | Pôle, association |
| Capacité | Capacité maximale, disponibilité réelle |
| Formation | Est formé, date de formation |
| Statut | Actif / Inactif |
| Observations | Notes internes libres |

---

### 11.3 Animateurs (AP / ACP)

**Section :** `Core > Animateurs`

Filtres : rôle (is_coordinator), actif/inactif, pôle, association.

**Fiche :**

| Section | Champs |
|---------|--------|
| Identité | Prénom, nom, email, téléphone, ville |
| Organisation | Pôle, association, est coordinateur (ACP si coché, AP si décoché) |
| Statut | Actif / Inactif |
| Compte | Lien vers le User |

---

### 11.4 Membres CN

**Section :** `Core > CN members`

Filtres : actif, super admin, accès complet, fonction, association, pôle.

**Fiche :**

| Section | Champs |
|---------|--------|
| Identité | Prénom, nom, email, téléphone, ville |
| Rôle | Fonction, association, pôle |
| Statut | Actif, Super administrateur, Accès complet |
| Compte lié | Lien vers le User |

---

### 11.5 Pôles

**Section :** `Core > Poles`

Filtres : statut (ACTIVE/INACTIVE), état d'activité.

**Fiche :**

| Section | Champs |
|---------|--------|
| Identité | Code (ex: ORA69), nom, statut, état d'activité |
| Localisation | Villes (max 5, séparées par virgule), départements couverts (sélection multiple) |
| Contact | Email, téléphone |

**États d'activité :** `a_letude`, `demarre`, `fragile`, `experimente`, `arrete`.

---

### 11.6 Demandes jeunes

**Section :** `Core > Young requests`

Filtres : statut, genre, pôle, diplôme, situation, urgence.

**Statuts :** NEW, PENDING, MATCHED, CLOSED.

**Fiche :**

| Section | Champs |
|---------|--------|
| Jeune | Prénom, nom, email, téléphone, date naissance, genre |
| Localisation | Commune, département, pôle |
| Établissement & Formation | Nom établissement libre, établissement FK, diplôme préparé, situation |
| Demande | Description des besoins, niveau d'urgence, statut |

---

### 11.7 Mentorats

**Section :** `Core > Mentorats`

Filtres : statut, alerte rouge, pôle.

**Fiche :**

| Section | Champs |
|---------|--------|
| Relations | Mentor, demande jeune, pôle, AP responsable |
| Dates | Affectation, fin prévue, clôture |
| Statut | PENDING / ACTIVE / CLOSED / ABORTED, raison de clôture |
| Suivi | Alerte rouge, dernier contact, notes, problématiques |

---

### 11.8 Suivi mentorat (rencontres)

**Section :** `Core > Suivi mentorats`

Toutes les rencontres enregistrées. Navigation par date (année/mois).

**Fiche :**

| Section | Champs |
|---------|--------|
| Mentorat | Lien vers le mentorat (autocomplete) |
| Rencontre | Date, durée en minutes, type (présentiel/téléphone/visio/autre) |
| Évaluation | Objectifs atteints (oui/non/partiel), notes libres |

---

### 11.9 Établissements

**Section :** `Core > Etablissements`

Filtres : actif/inactif, pôle. Champs : nom, code postal, pôle, statut.

---

### 11.10 Financements

**Section :** `Core > Financements`

| Colonne | Description |
|---------|-------------|
| Code | Identifiant unique (ex: `CFA_ALTERNANCE`) |
| Nom | Libellé affiché |
| Type | National (bleu) ou Local (violet) |

---

### 11.11 Messages de contact

**Section :** `Core > Contact messages`

Messages reçus via `/contact`. Non-lus affichés en premier. Marquer comme lu : ouvrir → cocher "Is read" → Enregistrer.

**Sujets :** apprenti(e), mentor, partenariat, presse/média, autre.

---

### 11.12 Décisions d'affectation

**Section :** `Core > Matching decisions`

Audit des affectations : décideur, score calculé, si le choix a différé de la suggestion n°1 (`overridden`).

---

## Annexe — Statuts des objets

### Demande jeune (`YoungRequest`)
| Statut | Description |
|--------|-------------|
| `NEW` | Demande reçue, non traitée |
| `PENDING` | En cours d'étude par l'ACP |
| `ASSIGNED` | Mentor affecté, mentorat créé |
| `CLOSED` | Demande archivée |

### Mentorat
| Statut | Description |
|--------|-------------|
| `PENDING` | Créé mais pas encore démarré |
| `ACTIVE` | En cours (inclut les "en attente de clôture") |
| `CLOSED` | Terminé normalement |
| `ABORTED` | Interrompu |

### Pôle
| Statut | Description |
|--------|-------------|
| `ACTIVE` | Pôle opérationnel |
| `INACTIVE` | Pôle suspendu |

---

*Manuel mis à jour le 2026-04-20 — Plateforme ORA*
