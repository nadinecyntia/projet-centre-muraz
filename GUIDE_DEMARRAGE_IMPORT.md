# 🚀 Guide de Démarrage Rapide - Import CSV/Excel

## ✅ Installation terminée !

Le nouveau système d'import CSV/Excel est maintenant opérationnel sur votre plateforme Centre MURAZ.

---

## 📋 Checklist de démarrage

- ✅ Backend installé (`routes/api-import-normalized.js`)
- ✅ Frontend mis à jour (`public/admin.html` + `public/js/import-manager.js`)
- ✅ Bibliothèque `xlsx` installée pour le support Excel
- ✅ Routes API configurées (`/api/import/*`)
- ✅ Serveur redémarré

---

## 🎯 Première utilisation

### 1. Se connecter à la plateforme

```
http://localhost:3000/login.html
```

Utilisez vos identifiants d'administrateur.

---

### 2. Accéder à l'interface d'import

1. Allez sur la page Admin : `http://localhost:3000/admin.html`
2. Trouvez la carte **"Import CSV/Excel"** (icône Excel verte)
3. Cliquez sur le bouton **"Importer des Données"**

---

### 3. Télécharger un template

1. Dans le modal qui s'ouvre, sélectionnez le **Type de données** :
   - 🥚 Œufs
   - 🦟 Gîtes Larvaires
   - 🦟 Moustiques Adultes

2. Cliquez sur **"Télécharger Template"**
3. Un fichier Excel (`.xlsx`) se téléchargera automatiquement

---

### 4. Remplir le fichier Excel

Ouvrez le fichier Excel téléchargé. Vous verrez les colonnes pré-formatées :

#### Exemple pour les Œufs :
| concession_code | sector | environment | visit_date | eggs_count |
|-----------------|--------|-------------|------------|------------|
| C001 | Secteur 1 | urban | 2024-01-15 | 45 |
| C002 | Secteur 2 | rural | 2024-01-16 | 67 |

**Colonnes obligatoires** (ne laissez jamais vides) :
- `concession_code` ✅
- `sector` ✅
- `environment` ✅
- `visit_date` ✅
- `eggs_count` ✅ (pour les œufs)
- `investigator_name` ✅ (pour gîtes/moustiques)
- `site_state` ✅ (pour gîtes : "positive" ou "negative")

---

### 5. Importer le fichier

1. Retournez sur `http://localhost:3000/admin.html`
2. Cliquez sur **"Importer des Données"**
3. Sélectionnez le même **type de données** que le template
4. Cliquez sur **"Choisir un fichier"** et sélectionnez votre fichier rempli
5. Cliquez sur **"Prévisualiser"**

---

### 6. Valider les données

La prévisualisation affichera :
- ✅ **Nombre de lignes** détectées
- ✅ **Tableau de prévisualisation** (premières lignes)
- ⚠️ **Erreurs de validation** (si présentes)

**Si erreurs** :
- Corrigez votre fichier Excel
- Ré-importez et prévisualisez à nouveau

**Si tout est OK** (✅ vert) :
- Le bouton **"Importer les Données"** sera activé

---

### 7. Exécuter l'import

1. Cliquez sur **"Importer les Données"**
2. Confirmez l'import
3. Patientez pendant le traitement
4. Consultez le rapport d'import :
   - ✅ **X enregistrements importés**
   - ⚠️ **Y enregistrements ignorés** (erreurs)
   - 📋 **Liste des erreurs** (si présentes)

---

### 8. Valider les données importées

Les données importées ont le statut `pending` (en attente).

Pour les valider :
1. Allez sur `http://localhost:3000/admin/pending`
2. Consultez les enregistrements importés
3. Cliquez sur **"Voir"** pour vérifier les détails
4. Cliquez sur **"Valider"** ou **"Rejeter"**

---

## 🔑 Points importants

### ✅ Gestion automatique des maisons

Le système gère automatiquement la table `houses` :
- Si une maison existe déjà (`concession_code` + `sector`), elle est réutilisée
- Sinon, elle est créée automatiquement
- Vous n'avez pas besoin de créer les maisons manuellement !

### ✅ Calculs automatiques

Le système calcule automatiquement :
- **Gîtes** : `larvae_count` = somme de `aedes_larvae_count + culex_larvae_count + anopheles_larvae_count + other_larvae_count`
- **Gîtes** : `nymphs_count` = somme de `aedes_nymphs_count + culex_nymphs_count + anopheles_nymphs_count + other_nymphs_count`
- **Moustiques** : `total_mosquitoes_count` = `male_count + female_count`

### ✅ Formats de date acceptés

- `2024-01-15`
- `15/01/2024`
- `15-01-2024`
- `2024/01/15`

Excel gère automatiquement les dates.

### ✅ Valeurs pour `environment`

- `urban` (urbain)
- `rural` (rural)

### ✅ Valeurs pour `site_state` (gîtes)

- `positive` (gîte positif)
- `negative` (gîte négatif)

---

## ❌ Erreurs fréquentes

### Erreur : "Ligne X: concession_code manquant"
**Solution** : Remplissez toutes les cellules de la colonne `concession_code`

### Erreur : "Ligne X: visit_date manquant"
**Solution** : Assurez-vous que toutes les dates sont au bon format

### Erreur : "Ligne X: site_state manquant"
**Solution** : Pour les gîtes, chaque ligne doit avoir `positive` ou `negative`

### Erreur : "Format de fichier non supporté"
**Solution** : Utilisez uniquement `.csv`, `.xls` ou `.xlsx`

### Erreur : 401 Non autorisé
**Solution** : Connectez-vous d'abord avec vos identifiants d'administrateur

---

## 📊 Exemple complet

### Fichier CSV pour les Gîtes Larvaires

```csv
concession_code,sector,environment,visit_date,investigator_name,site_state,aedes_larvae_count,culex_larvae_count,anopheles_larvae_count,other_larvae_count,observations
C001,Secteur 1,urban,2024-01-15,Jean Dupont,positive,10,5,2,0,Site près d'un puits
C002,Secteur 2,rural,2024-01-15,Marie Martin,negative,0,0,0,0,Aucune larve trouvée
C003,Secteur 1,urban,2024-01-16,Paul Durand,positive,15,8,3,1,Pneu abandonné
```

Le système calculera automatiquement :
- Ligne 1 : `larvae_count` = 10 + 5 + 2 + 0 = **17**
- Ligne 2 : `larvae_count` = 0 + 0 + 0 + 0 = **0**
- Ligne 3 : `larvae_count` = 15 + 8 + 3 + 1 = **27**

---

## 🎓 Conseils Pro

1. **Toujours télécharger le template** pour avoir la structure exacte
2. **Prévisualiser avant d'importer** pour détecter les erreurs
3. **Importer par petits lots** (ex: 50-100 lignes) pour faciliter le débogage
4. **Garder une copie de vos fichiers** avant l'import
5. **Valider régulièrement** les données importées via la page de validation

---

## 📞 Besoin d'aide ?

Consultez la documentation complète : `SYSTEME_IMPORT_CSV_EXCEL.md`

---

**✅ Vous êtes prêt à importer vos données !** 🚀

Bonne utilisation ! 💪

