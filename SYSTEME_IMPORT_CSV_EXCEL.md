# 📊 Système d'Import CSV/Excel - Centre MURAZ

## 🎯 Vue d'ensemble

Le nouveau système d'import permet d'importer des données entomologiques en masse à partir de fichiers **CSV** ou **Excel** (.xlsx, .xls), compatible avec la structure normalisée de la base de données.

---

## ✅ Fonctionnalités

### 1. Support multi-formats
- ✅ **CSV** (.csv)
- ✅ **Excel 2007+** (.xlsx)
- ✅ **Excel 97-2003** (.xls)

### 2. Validation complète
- ✅ Validation des colonnes obligatoires
- ✅ Validation des types de données
- ✅ Rapport d'erreurs détaillé ligne par ligne
- ✅ Prévisualisation avant import

### 3. Gestion automatique de la table `houses`
- ✅ **Find or Create**: Le système cherche d'abord si une maison existe (`concession_code` + `sector`)
- ✅ Si elle existe, utilise son ID
- ✅ Si elle n'existe pas, crée automatiquement la maison
- ✅ Évite les doublons et assure l'intégrité référentielle

### 4. Calculs automatiques
- ✅ **Gîtes larvaires**: `larvae_count` et `nymphs_count` calculés automatiquement
- ✅ **Moustiques adultes**: `total_mosquitoes_count` calculé automatiquement
- ✅ Évite les erreurs de saisie manuelle

---

## 📁 Structure des fichiers

### Fichier template Excel - Œufs (`eggs`)

| Colonne | Type | Obligatoire | Description |
|---------|------|-------------|-------------|
| `concession_code` | Texte | ✅ | Code de la concession |
| `house_code` | Texte | ⬜ | Code de la maison |
| `sector` | Texte | ✅ | Secteur |
| `environment` | Texte | ✅ | Milieu (urban/rural) |
| `gps_coordinates` | Texte | ⬜ | Coordonnées GPS |
| `visit_date` | Date | ✅ | Date de la visite |
| `investigator_name` | Texte | ⬜ | Nom de l'enquêteur |
| `nest_number` | Nombre | ⬜ | Numéro du nid |
| `nest_code` | Texte | ⬜ | Code du nid |
| `pass_order` | Nombre | ⬜ | Numéro de passage |
| `eggs_count` | Nombre | ✅ | Nombre d'œufs |
| `observations` | Texte | ⬜ | Observations |

---

### Fichier template Excel - Gîtes larvaires (`breeding`)

| Colonne | Type | Obligatoire | Description |
|---------|------|-------------|-------------|
| `concession_code` | Texte | ✅ | Code de la concession |
| `house_code` | Texte | ⬜ | Code de la maison |
| `sector` | Texte | ✅ | Secteur |
| `environment` | Texte | ✅ | Milieu (urban/rural) |
| `gps_coordinates` | Texte | ⬜ | Coordonnées GPS |
| `visit_date` | Date | ✅ | Date de la visite |
| `investigator_name` | Texte | ✅ | Nom de l'enquêteur |
| `site_state` | Texte | ✅ | État du site (positive/negative) |
| `aedes_larvae_count` | Nombre | ⬜ | Nombre de larves Aedes |
| `culex_larvae_count` | Nombre | ⬜ | Nombre de larves Culex |
| `anopheles_larvae_count` | Nombre | ⬜ | Nombre de larves Anopheles |
| `other_larvae_count` | Nombre | ⬜ | Nombre de larves Autres |
| `aedes_nymphs_count` | Nombre | ⬜ | Nombre de nymphes Aedes |
| `culex_nymphs_count` | Nombre | ⬜ | Nombre de nymphes Culex |
| `anopheles_nymphs_count` | Nombre | ⬜ | Nombre de nymphes Anopheles |
| `other_nymphs_count` | Nombre | ⬜ | Nombre de nymphes Autres |
| `observations` | Texte | ⬜ | Observations |

> **Note**: `larvae_count` et `nymphs_count` sont calculés automatiquement en faisant la somme des comptages par genre.

---

### Fichier template Excel - Moustiques adultes (`mosquitoes`)

| Colonne | Type | Obligatoire | Description |
|---------|------|-------------|-------------|
| `concession_code` | Texte | ✅ | Code de la concession |
| `house_code` | Texte | ⬜ | Code de la maison |
| `sector` | Texte | ✅ | Secteur |
| `environment` | Texte | ✅ | Milieu (urban/rural) |
| `gps_coordinates` | Texte | ⬜ | Coordonnées GPS |
| `visit_date` | Date | ✅ | Date de la visite |
| `investigator_name` | Texte | ⬜ | Nom de l'enquêteur |
| `collection_methods` | Texte | ⬜ | Méthodes de collecte |
| `capture_locations` | Texte | ⬜ | Lieux de capture |
| `prokopack_traps_count` | Nombre | ⬜ | Nombre de pièges Prokopack |
| `bg_traps_count` | Nombre | ⬜ | Nombre de pièges BG |
| `male_count` | Nombre | ⬜ | Nombre de mâles |
| `female_count` | Nombre | ⬜ | Nombre de femelles |
| `aedes_male_count` | Nombre | ⬜ | Mâles Aedes |
| `culex_male_count` | Nombre | ⬜ | Mâles Culex |
| `anopheles_male_count` | Nombre | ⬜ | Mâles Anopheles |
| `other_male_count` | Nombre | ⬜ | Mâles Autres |
| `blood_fed_females_count` | Nombre | ⬜ | Femelles gorgées |
| `gravid_females_count` | Nombre | ⬜ | Femelles gravides |
| `starved_females_count` | Nombre | ⬜ | Femelles à jeun |
| `mosquitoes_aedes_count` | Nombre | ⬜ | Total Aedes |
| `mosquitoes_culex_count` | Nombre | ⬜ | Total Culex |
| `mosquitoes_anopheles_count` | Nombre | ⬜ | Total Anopheles |
| `mosquitoes_other_count` | Nombre | ⬜ | Total Autres |
| `observations` | Texte | ⬜ | Observations |

> **Note**: `total_mosquitoes_count` est calculé automatiquement (`male_count + female_count`).

---

## 🚀 Guide d'utilisation

### Étape 1 : Accéder à l'interface
1. Connectez-vous en tant qu'administrateur
2. Allez sur la page **Admin**
3. Cliquez sur le bouton **"Importer des Données"** (carte verte avec icône Excel)

### Étape 2 : Préparer votre fichier
1. Cliquez sur **"Télécharger Template"** pour obtenir un fichier Excel pré-formaté
2. Sélectionnez d'abord le **type de données** (Œufs, Gîtes, ou Moustiques)
3. Remplissez le fichier Excel avec vos données
4. Respectez les colonnes obligatoires (marquées ✅)

### Étape 3 : Importer
1. Sélectionnez le **type de données** correspondant
2. Choisissez votre fichier (CSV ou Excel)
3. Cliquez sur **"Prévisualiser"** pour valider les données
4. Si tout est OK (✅ vert), cliquez sur **"Importer les Données"**
5. Consultez le rapport d'import (nombre d'enregistrements importés, erreurs éventuelles)

---

## 🔧 Architecture technique

### Backend

#### Routes API (`/api/import/*`)

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/import/template/:type` | GET | Télécharge un template Excel |
| `/api/import/preview` | POST | Prévisualise et valide le fichier |
| `/api/import/execute` | POST | Exécute l'import des données |

#### Logique backend (`routes/api-import-normalized.js`)

```javascript
// Parse CSV ou Excel
function parseFile(buffer, filename) {
    // Utilise la bibliothèque XLSX
    // Convertit en JSON
}

// Find or Create House
async function findOrCreateHouse(client, houseData) {
    // Cherche d'abord si la maison existe
    // Sinon, la crée
    // Retourne l'ID de la maison
}

// Validation des données
function validateEggsData(row, index) { ... }
function validateBreedingData(row, index) { ... }
function validateMosquitoesData(row, index) { ... }

// Import avec transaction
POST /execute {
    BEGIN TRANSACTION
    for (row in data) {
        houseId = findOrCreateHouse()
        INSERT INTO eggs_collections / breeding_sites / adult_mosquitoes_collections
    }
    COMMIT
}
```

### Frontend

#### Fichiers
- **HTML**: `public/admin.html` (modal d'import)
- **JavaScript**: `public/js/import-manager.js` (classe `ImportManager`)

#### Classe `ImportManager`

```javascript
class ImportManager {
    openModal()                // Ouvre le modal
    closeModal()               // Ferme le modal
    handleFileSelect(e)        // Gère la sélection de fichier
    downloadTemplate()         // Télécharge le template
    previewFile()              // Prévisualise et valide
    executeImport()            // Exécute l'import
    showPreview(data)          // Affiche la prévisualisation
    showImportResults(result)  // Affiche les résultats
}
```

---

## 📊 Workflow complet

```
┌─────────────────────────────────────────────────────────────────┐
│                  1. SÉLECTION DU TYPE ET FICHIER                │
│   Utilisateur choisit: Œufs / Gîtes / Moustiques + Fichier     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. PRÉVISUALISATION (Backend)                │
│   • Parse le fichier (CSV ou Excel)                             │
│   • Validation des colonnes obligatoires                        │
│   • Validation des types de données                             │
│   • Retourne erreurs ligne par ligne                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  3. AFFICHAGE PRÉVISUALISATION                  │
│   • Tableau des premières lignes                                │
│   • Liste des erreurs (si présentes)                            │
│   • Bouton "Importer" activé seulement si valide               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      4. EXÉCUTION IMPORT                        │
│   BEGIN TRANSACTION                                             │
│   FOR chaque ligne:                                             │
│     • Find or Create House (concession_code + sector)           │
│     • INSERT dans eggs/breeding/mosquitoes                      │
│     • Calculs automatiques (larvae_count, total_mosquitoes)     │
│   COMMIT                                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   5. RAPPORT D'IMPORT                           │
│   • Nombre d'enregistrements importés                           │
│   • Nombre d'enregistrements ignorés (erreurs)                  │
│   • Liste des erreurs détaillées                                │
│   • Statut: "pending" → À valider                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Sécurité et validation

### Validation des fichiers
- ✅ Limite de taille: **10 MB**
- ✅ Types MIME autorisés:
  - `text/csv`
  - `application/vnd.ms-excel`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- ✅ Extensions autorisées: `.csv`, `.xls`, `.xlsx`

### Validation des données
- ✅ Colonnes obligatoires vérifiées
- ✅ Types de données validés
- ✅ Erreurs reportées ligne par ligne
- ✅ Import uniquement si toutes les données sont valides

### Intégrité de la base de données
- ✅ Transactions atomiques (tout ou rien)
- ✅ Foreign keys respectées (lien avec `houses`)
- ✅ Statut par défaut: `pending` (nécessite validation manuelle)

---

## 📋 Exemple de fichier CSV (Œufs)

```csv
concession_code,house_code,sector,environment,gps_coordinates,visit_date,investigator_name,nest_number,nest_code,pass_order,eggs_count,observations
C001,H001,Secteur 1,urban,12.3456,-1.2345,2024-01-15,Jean Dupont,1,NEST01,1,45,RAS
C002,H002,Secteur 2,rural,12.3457,-1.2346,2024-01-15,Marie Martin,2,NEST02,1,67,Bon état
C003,H003,Secteur 1,urban,12.3458,-1.2347,2024-01-16,Paul Durand,3,NEST03,2,23,
```

---

## ❓ FAQ

### Q: Puis-je importer des données avec un fichier Excel au lieu de CSV ?
**R:** Oui ! Le système supporte à la fois CSV et Excel (.xlsx, .xls).

### Q: Que se passe-t-il si une maison existe déjà ?
**R:** Le système utilise la logique "Find or Create" : il cherche d'abord la maison par `concession_code` + `sector`. Si elle existe, il réutilise son ID. Sinon, il la crée automatiquement.

### Q: Les données importées sont-elles immédiatement validées ?
**R:** Non, toutes les données importées ont le statut `pending` et doivent être validées manuellement via la page **Validation des Données**.

### Q: Que faire si j'ai des erreurs lors de l'import ?
**R:** Le système vous affichera un rapport détaillé des erreurs ligne par ligne. Corrigez votre fichier et ré-importez.

### Q: Puis-je importer plusieurs types de données en même temps ?
**R:** Non, chaque import concerne un seul type de données (Œufs, Gîtes, ou Moustiques). Faites des imports séparés si nécessaire.

---

## ✅ Avantages du nouveau système

| Ancien système | Nouveau système |
|---------------|-----------------|
| CSV uniquement | **CSV + Excel** |
| Pas de prévisualisation | **Prévisualisation complète** |
| Validation limitée | **Validation détaillée ligne par ligne** |
| Structure denormalisée | **Compatible structure normalisée** |
| Gestion manuelle des maisons | **Find or Create automatique** |
| Calculs manuels | **Calculs automatiques** |
| Erreurs peu claires | **Rapport d'erreurs détaillé** |

---

## 📞 Support

Pour toute question ou problème technique, consultez la documentation technique ou contactez l'équipe de développement.

---

**📅 Dernière mise à jour**: 2025-01-26  
**📝 Version**: 2.0 - Système normalisé avec support CSV/Excel

