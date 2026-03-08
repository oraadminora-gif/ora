# Manuel d'utilisation — Plateforme ORA

> **ORA** (Orientation, Réseau, Accompagnement) est une plateforme de gestion du mentorat pour apprentis.
> Elle connecte des jeunes en apprentissage avec des mentors bénévoles, encadrés par des animateurs de pôle.

---

## Table des matières

1. [Vue d'ensemble des rôles](#1-vue-densemble-des-rôles)
2. [Accès public — Inscription jeune](#2-accès-public--inscription-jeune)
3. [Connexion et navigation](#3-connexion-et-navigation)
4. [Rôle Mentor](#4-rôle-mentor)
5. [Rôle AP — Animateur de Pôle](#5-rôle-ap--animateur-de-pôle)
6. [Rôle ACP — Animateur Coordinateur de Pôle](#6-rôle-acp--animateur-coordinateur-de-pôle)
7. [Rôle CN — Coordination Nationale](#7-rôle-cn--coordination-nationale)
8. [Cycle de vie complet d'un mentorat](#8-cycle-de-vie-complet-dun-mentorat)
9. [Système d'évaluation](#9-système-dévaluation)
10. [Gestion des financements](#10-gestion-des-financements)

---

## 1. Vue d'ensemble des rôles

| Rôle | Qui ? | Responsabilités principales |
|------|-------|-----------------------------|
| **Jeune (public)** | Apprenti ou chercheur d'apprentissage | S'inscrire, évaluer son mentor |
| **Mentor** | Professionnel bénévole | Suivre ses jeunes en mentorat |
| **AP** | Animateur de Pôle | Encadrer les mentors, valider les clôtures |
| **ACP** | Animateur Coordinateur de Pôle | Matching, suivi global du pôle, KPIs |
| **CN (limité)** | Membre CN lecture seule | Consulter les données nationales |
| **CN (complet)** | Membre CN admin | Gérer mentors, pôles, animateurs, membres CN |

---

## 2. Accès public — Inscription jeune

### 2.1 Déposer une demande de mentorat

**URL :** `/apprentis/inscription`

Le jeune remplit un formulaire en plusieurs sections :

#### Informations personnelles
| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Prénom / Nom | ✅ | Identité du jeune |
| Email | ✅ | Utilisé pour les communications |
| Téléphone | Non | Optionnel |
| Date de naissance | Non | Aide à l'affectation d'un mentor adapté |
| Genre | Non | Garçon / Fille / Autre |

#### Localisation et pôle
| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| **Pôle ORA** | ✅ | Liste déroulante des pôles actifs. **Détermine quel pôle traitera la demande.** |
| Ville | ✅ | Utilisée pour le matching géographique avec les mentors |
| Département (code) | Non | Ex : 75, 69, 13 — affine le matching |

#### Parcours
| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Diplôme préparé | Non | CAP, BEP, Bac Pro, BTS, Master… (13 options groupées par niveau) |
| Situation | ✅ | **Déjà en apprentissage** ou **En recherche d'apprentissage** |
| École / CFA | Non | Nom libre de l'établissement |

#### Besoins d'accompagnement
Cases à cocher (plusieurs choix possibles) :
- Orientation professionnelle
- Confiance en soi
- Organisation et méthode de travail
- Difficultés scolaires
- Difficultés en entreprise
- Gestion de la vie quotidienne
- Changement d'entreprise
- Autre (champ texte libre)

#### Consentement RGPD
Le jeune doit cocher la case d'acceptation de la politique de confidentialité avant d'envoyer.

> **Après l'envoi :** un message de confirmation s'affiche et le jeune est redirigé vers l'accueil au bout de 3 secondes. La demande apparaît dans le tableau de bord ACP du pôle sélectionné avec le statut **NOUVEAU**.

---

## 3. Connexion et navigation

### 3.1 Connexion

**URL :** `/login`

- Saisir **email** et **mot de passe**
- Lors de la première connexion, utiliser le **mot de passe temporaire** communiqué par l'administrateur (CN ou ACP)
- Si un utilisateur a plusieurs rôles (ex : mentor ET AP), un sélecteur de rôle apparaît en haut de page

### 3.2 Mot de passe temporaire

Les comptes sont créés par les administrateurs. Le mot de passe temporaire est affiché **une seule fois** lors de la création. Il doit être communiqué à l'utilisateur par un canal sécurisé (email, message direct).

### 3.3 Déconnexion

Bouton **Déconnexion** en haut à droite de toutes les pages connectées.

---

## 4. Rôle Mentor

### Navigation disponible
- **Mes mentorats** → tableau de bord principal

### 4.1 Tableau de bord Mentor

Le mentor voit la liste de ses mentorats actifs. Pour chaque jeune :

#### Informations affichées
- Nom / prénom du jeune
- Établissement (école/CFA)
- Diplôme préparé
- Situation (apprentissage / recherche)
- Animateur responsable (AP)

#### Modifier les informations du jeune
Le mentor peut mettre à jour depuis sa fiche :
- **Établissement** : liste déroulante des établissements de son pôle + option "Autre" pour saisie libre
- **Nom de l'établissement** (si "Autre" sélectionné)

#### Demander la clôture d'un mentorat
1. Cliquer sur **Clôturer** ou **Arrêter** selon le cas :
   - **Clôturer** = mentorat terminé normalement
   - **Arrêter** = mentorat interrompu (abandon, déménagement…)
2. Saisir une **raison obligatoire** dans le champ texte
3. Confirmer

> **Important :** La demande de clôture ne prend pas effet immédiatement. Elle passe en statut **"en attente de confirmation"**. L'AP responsable doit valider avant que le mentorat soit réellement clôturé.

#### Voir l'historique et les évaluations reçues
Dans la section **Bilan** de la fiche mentorat :
- Liste des mentorats terminés
- Pour chaque mentorat clôturé ayant reçu une évaluation : affichage de la **note en étoiles (1-5)** et du **commentaire** du jeune

---

## 5. Rôle AP — Animateur de Pôle

### Navigation disponible
- **Tableau de bord**
- **Gestion mentors**

### 5.1 Tableau de bord AP

Vue centrée sur les mentorats dont l'AP est responsable.

#### Section "Mes mentorats actifs"
Liste de tous les mentorats actifs affectés à cet AP. Pour chaque mentorat :
- Infos jeune + mentor
- Possibilité de modifier les infos du jeune (établissement, en liste déroulante filtrée par pôle)

#### Section "Clôtures en attente" ⚠️
Cette section apparaît dès qu'un mentor a soumis une demande de clôture.

Pour chaque demande en attente :
- Nom du mentor et du jeune concernés
- Action demandée (clôture normale ou arrêt)
- Raison fournie par le mentor

**Actions disponibles :**

| Bouton | Effet |
|--------|-------|
| **Confirmer** | La clôture est effective. Un email est envoyé au jeune avec un lien d'évaluation. Le mentorat passe au statut CLOSED ou ABORTED. |
| **Rejeter** | La demande est annulée. Le mentorat redevient actif. Le mentor peut re-soumettre. |

### 5.2 Gestion des mentors

Liste des mentors de l'association de l'AP.

#### Voir le profil d'un mentor
Cliquer sur un mentor pour voir :
- Ses informations personnelles
- Son nombre de mentorats actifs / terminés
- Sa disponibilité restante (`disponibilite_reelle / max_capacity`)

---

## 6. Rôle ACP — Animateur Coordinateur de Pôle

### Navigation disponible
- **Dashboard** — vue globale du pôle
- **Matching** — affecter les mentors aux demandes
- **KPIs** — indicateurs de performance du pôle
- **Suivi mentorats** — gestion détaillée
- **Gestion** — animateurs, établissements

### 6.1 Dashboard pôle

Vue d'ensemble avec :
- Nombre de demandes en attente
- Mentorats actifs / clôturés
- Mentors disponibles
- Graphiques d'activité récente

### 6.2 Matching — Affecter un mentor à un jeune

**Accès :** Menu Matching

C'est la fonctionnalité centrale de l'ACP. Elle permet de connecter une demande de jeune avec le mentor le plus adapté.

#### Étape 1 — Sélectionner une demande
La liste affiche toutes les demandes avec le statut **NOUVEAU** ou **EN ATTENTE** dans le pôle. Informations visibles :
- Nom du jeune
- Diplôme préparé, situation
- Établissement
- Date de dépôt

#### Étape 2 — Consulter les suggestions
Après avoir cliqué sur une demande, l'algorithme calcule automatiquement un **score de compatibilité** pour chaque mentor disponible du pôle.

**Comment le score est calculé :**

| Critère | Points |
|---------|--------|
| Places disponibles | `disponibilite_reelle × 25` pts (max 75) |
| Même ville que le jeune | +80 pts |
| Même département | +40 pts |
| Aucune proximité géo | +10 pts (fallback) |
| Mentor formé (`is_trained`) | +15 pts |
| Expérience (mentorats terminés) | `nb_terminés × 3` pts (max 30) |

**Score max théorique :** ~200 pts

**Codes couleur des badges de score :**
- 🟣 **≥ 120 pts** — Excellent
- 🟢 **≥ 80 pts** — Bon
- ⚫ **< 80 pts** — Acceptable

> Les 10 meilleurs mentors sont affichés, triés par score décroissant.

#### Étape 3 — Choisir et confirmer
1. Cliquer sur le mentor souhaité
2. Optionnel : saisir une **justification** si le choix diffère du premier suggéré (l'écart est tracé en base pour audit)
3. Cliquer **Confirmer l'affectation**

Le mentorat est créé, le statut de la demande passe à **ASSIGNÉ**. L'AP responsable de l'association du mentor est automatiquement assigné au suivi.

#### Rerouter une demande vers un autre pôle
Si une demande ne peut être traitée dans ce pôle :
1. Ouvrir la demande
2. Cliquer **Rerouter**
3. Sélectionner le pôle de destination
4. Confirmer

La demande disparaît du tableau de ce pôle et apparaît dans celui du pôle destinataire.

### 6.3 Suivi des mentorats

Vue de tous les mentorats du pôle avec filtres par statut (ACTIF, CLÔTURÉ, ARRÊTÉ).

#### Modifier les informations du jeune (dans la fiche mentorat)
| Champ modifiable | Type |
|-----------------|------|
| Établissement | Liste déroulante du pôle + "Autre" |
| Nom de l'établissement libre | Texte |
| Diplôme préparé | Select groupé par niveau |
| Date de naissance | Date |
| Genre | Garçon / Fille / Autre |

#### Gérer les financements d'un mentorat
Dans la fiche d'un mentorat, section **Financements** :
- Voir la liste des financements attachés
- Ajouter un financement existant (liste nationale)
- Supprimer un financement

> Les financements sont créés par la CN (locaux ou nationaux). Chaque mentorat peut avoir plusieurs financements.

#### Confirmer/Rejeter une clôture (comme l'AP)
L'ACP peut également confirmer ou rejeter les clôtures de tous les mentorats de son pôle, pas seulement ceux de son association.

### 6.4 Gestion des animateurs

Liste de tous les AP et ACP du pôle.

#### Créer un animateur
1. Cliquer **Nouvel animateur**
2. Remplir : prénom, nom, email, téléphone, ville
3. Choisir l'**association** (AGIR, ECTI, EGEE ou OTECI)
4. Choisir le **rôle** : AP ou ACP
5. Confirmer → un **mot de passe temporaire** est généré et affiché une seule fois

#### Désactiver / Réactiver un compte
- **Désactiver** (icône croix) : le compte est bloqué, l'animateur ne peut plus se connecter
- **Réactiver** (icône utilisateur+) : rétablit l'accès

### 6.5 Gestion des établissements

Liste des établissements (écoles, CFA) référencés pour ce pôle.

#### Ajouter un établissement
1. Cliquer **Ajouter**
2. Renseigner : nom, code postal
3. Confirmer

Les établissements créés ici apparaissent dans les listes déroulantes des fiches jeunes (mentor, AP, ACP).

### 6.6 KPIs du pôle

Indicateurs clés avec choix de période (6 mois / 12 mois / tout) :
- Nombre de demandes reçues
- Taux d'assignation
- Durée moyenne de mentorat
- Taux de clôture positive
- Répartition par diplôme, genre, situation

**Exporter en PDF :** bouton en haut à droite, avec sélection des sections à inclure.

---

## 7. Rôle CN — Coordination Nationale

Deux niveaux d'accès selon le champ `cn_acces_complet` :

| Accès | Pages disponibles |
|-------|-------------------|
| **Limité** | Accueil, Annuaire ORA, Implantation, KPIs nationaux |
| **Complet** | Tout + Mentors, Pôles, Configuration |

> L'accès complet est accordé par un membre CN avec accès complet via la page Configuration.

### 7.1 Accueil (Dashboard CN)

Vue nationale synthétique :
- Total pôles actifs
- Total mentors / mentorats actifs
- Total jeunes en attente
- Répartition par association nationale
- Tableau récapitulatif par pôle

### 7.2 Annuaire ORA

Répertoire complet de tous les membres CN et animateurs (AP/ACP) de France.

**Filtres disponibles :**
- Par rôle (CN / ACP / AP)
- Par pôle
- Par association
- Recherche texte (nom, email)

Informations affichées pour chaque personne : nom, email, téléphone, ville, association, pôle, fonction.

### 7.3 Implantation des Pôles

**Carte interactive de France** colorisée par état d'activité du pôle :

| Couleur | État |
|---------|------|
| 🔵 Bleu clair | À l'étude |
| 🟢 Vert | Démarré |
| 🟡 Jaune | Fragile |
| 🟣 Violet | Expérimenté |
| 🔴 Rouge | Arrêté |
| ⚫ Gris | Non couvert |

**Interactions :**
- **Survoler** un département → tooltip avec le nom du pôle, son état, et ses chiffres clés
- **Cliquer** un département → panneau de détail du pôle (mentors, mentorats, animateurs, villes, contact)
- **Filtrer** par état via les badges colorés en haut de page
- **Exporter PDF** → impression A4 paysage avec la carte et la légende (bouton "Exporter PDF" en haut à droite)

### 7.4 KPIs Nationaux

Indicateurs agrégés à l'échelle nationale.

**Vues disponibles :**
- Vue nationale globale
- Vue par pôle (sélecteur de pôle en haut)

**Données affichées :**
- Volume de demandes et taux de traitement
- Mentorats actifs / terminés / arrêtés
- Durées moyennes
- Répartition par association, diplôme, genre
- Tableau comparatif des pôles (trié par colonne au clic)
- Données sur les financements

**Exporter PDF :** Sélection des sections à inclure avant impression.

### 7.5 Gestion nationale des mentors *(accès complet)*

Liste de tous les mentors de France avec filtres par pôle, association, statut.

Actions disponibles :
- Voir le profil complet d'un mentor
- Activer / désactiver un compte mentor

### 7.6 Gestion des pôles *(accès complet)*

Liste de tous les pôles avec leurs indicateurs :
- Statut (ACTIF / INACTIF)
- Nombre d'animateurs, mentors, mentorats
- Départements couverts

Actions disponibles :
- Créer un pôle
- Modifier un pôle (nom, code, état, départements couverts)
- Activer / désactiver un pôle

### 7.7 Gestion nationale des animateurs *(accès complet)*

**URL :** `/member/cn/animateurs`

Même fonctionnement que la gestion des animateurs ACP, mais à l'échelle nationale (tous pôles confondus).

**Filtres :** par pôle, par rôle (ACP / AP), recherche texte.

**Créer un animateur :**
1. Cliquer **Nouvel animateur**
2. Saisir les informations (prénom, nom, email, téléphone, ville)
3. Choisir le **pôle** → la liste des associations disponibles se charge
4. Choisir l'**association**
5. Choisir le **rôle** (AP ou ACP)
6. Valider → mot de passe temporaire affiché une seule fois

**Désactiver / Réactiver :**
- Icône croix (rouge) → désactive
- Icône utilisateur+ (verte) → réactive (sans repasser par le formulaire complet)

### 7.8 Configuration CN *(accès complet)*

Deux onglets :

#### Onglet "Membres CN"

Tableau de tous les membres CN avec :
- Nom, email, ville, association, pôle de rattachement
- Fonction (badge coloré)
- Toggle **Accès complet** : active/désactive l'accès aux pages de gestion pour ce membre
- Toggle **Actif** : active/désactive le compte

**Ajouter un membre CN :**
1. Cliquer **Ajouter**
2. Renseigner prénom, nom, email, téléphone, ville
3. Choisir fonction, association, pôle de rattachement (optionnels)
4. Option **Super administrateur** : donne accès à l'interface d'administration Django
5. Valider → mot de passe temporaire affiché une seule fois

> Un membre CN ne peut pas se désactiver lui-même.
> Un membre CN ne peut pas modifier son propre niveau d'accès complet.

#### Onglet "Mon profil"

Chaque membre CN peut modifier ses propres informations :
- Prénom, nom, téléphone, ville
- Fonction, association, pôle de rattachement

---

## 8. Cycle de vie complet d'un mentorat

```
[JEUNE]  Remplit le formulaire d'inscription
              ↓
         Demande créée → statut : NOUVEAU
              ↓
[ACP]    Consulte les demandes dans le tableau Matching
         Lance l'algorithme de suggestions (score calculé)
         Choisit un mentor et confirme
              ↓
         Mentorat créé → statut : ACTIF
         Demande → statut : ASSIGNÉ
         Disponibilité mentor decrementée de 1
              ↓
[MENTOR] Suit le jeune (mise à jour établissement, infos)
         Peut demander la clôture à tout moment
              ↓
         Si demande de clôture :
         Mentorat → statut toujours ACTIF mais "en attente"
              ↓
[AP/ACP] Valide ou rejette la demande de clôture
              ↓
         Si confirmé :
         → Mentorat → CLÔTURÉ (normal) ou ARRÊTÉ (abandon)
         → Disponibilité mentor incrementée de 1
         → Email envoyé au jeune avec lien d'évaluation
         → Token d'évaluation créé (valable une seule fois)
              ↓
[JEUNE]  Clique sur le lien reçu par email
         Accède à la page publique d'évaluation
         Note de 1 à 5 étoiles + commentaire optionnel
              ↓
[MENTOR] Voit l'évaluation dans son historique (section Bilan)
```

---

## 9. Système d'évaluation

### Pour le jeune
Après confirmation de clôture par l'AP/ACP, le jeune reçoit un email contenant un **lien unique** vers une page publique d'évaluation.

**URL :** `/evaluer-mentor/:token` (pas de connexion requise)

Le jeune peut :
- Attribuer une **note de 1 à 5 étoiles**
- Laisser un **commentaire libre** (optionnel)

> Le token est à usage unique. Une fois l'évaluation soumise, le lien n'est plus utilisable.

### Pour le mentor
Dans son tableau de bord, section **Bilan**, le mentor voit pour chaque mentorat clôturé :
- La note reçue (affichée en étoiles)
- Le commentaire du jeune
- La date de soumission de l'évaluation

---

## 10. Gestion des financements

### Qui peut créer des financements ?
Uniquement les membres **CN avec accès complet**, via l'interface d'administration ou l'API.

Deux types :
- **Local** : spécifique à un pôle
- **National** : disponible pour tous les pôles

### Qui peut attacher un financement à un mentorat ?
L'**ACP** dans la page **Suivi des mentorats**, section Financements de la fiche mentorat.

### Opérations disponibles pour l'ACP
| Action | Description |
|--------|-------------|
| Voir | Liste des financements attachés avec leur code |
| Ajouter | Sélectionner parmi la liste nationale disponible |
| Supprimer | Retirer un financement d'un mentorat |

> Un même financement ne peut être ajouté qu'une seule fois par mentorat.

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
| `ACTIVE` | Mentorat en cours (inclut les "en attente de clôture") |
| `CLOSED` | Mentorat terminé normalement |
| `ABORTED` | Mentorat interrompu |

### Pôle
| Statut | Description |
|--------|-------------|
| `ACTIVE` | Pôle opérationnel |
| `INACTIVE` | Pôle suspendu |

---

*Manuel généré le 2026-03-08 — Plateforme ORA*
