# ✅ CORRECTION DES INDICES ENTOMOLOGIQUES - STRUCTURE NORMALISÉE

Date : 23 octobre 2025

---

## 🎯 OBJECTIF

Adapter le système de calcul des indices entomologiques pour utiliser la **nouvelle structure normalisée** de la base de données avec comptage correct des maisons.

---

## 📊 MODIFICATIONS APPORTÉES

### 1. ✅ **Nouvelle API Créée : `routes/api-indices-normalized.js`**

Remplace l'ancienne API qui utilisait les tables dénormalisées.

#### **Changements Majeurs :**

| Aspect | Ancienne Structure | Nouvelle Structure |
|--------|-------------------|-------------------|
| **Tables utilisées** | `eggs_collection_new`<br>`breeding_sites_new`<br>`adult_mosquitoes_new` | `eggs_collections`<br>`breeding_sites`<br>`adult_mosquitoes_collections`<br>`houses` (table centrale) |
| **Comptage maisons (gîtes)** | ❌ `COUNT(DISTINCT concession_code/house_code)`<br>(compte les lignes, pas les maisons) | ✅ `COUNT(DISTINCT house_id)`<br>(compte vraiment les maisons) |
| **Comptage maisons (moustiques)** | ❌ Logique approximative `COUNT / 2` | ✅ `COUNT(DISTINCT house_id)` |
| **Champs dénormalisés** | `total_sites_count`, `positive_sites_count` | ✅ Calculé avec `COUNT(*)` et `SUM(CASE)` |
| **État des gîtes** | Champs agrégés | ✅ `site_state = 'positive'/'negative'` par gîte |

---

### 2. ✅ **Formules Implémentées Correctement**

#### **1️⃣ Indice de Breteau (IB)**
```
(Nombre de gîtes positifs × 100) ÷ Nombre de maisons visitées
```
```sql
CASE WHEN total_houses_breeding > 0 
     THEN ROUND((positive_sites::decimal * 100) / total_houses_breeding, 2) 
     ELSE 0 END
```
✅ **Correction** : `positive_sites` = `SUM(is_positive_site)` où `is_positive_site = CASE WHEN site_state = 'positive' THEN 1 ELSE 0 END`

---

#### **2️⃣ Indice de Maison (IM)**
```
(Nombre de maisons avec ≥1 gîte positif × 100) ÷ Nombre total de maisons visitées
```
```sql
CASE WHEN total_houses_breeding > 0 
     THEN ROUND((positive_houses_breeding::decimal * 100) / total_houses_breeding, 2) 
     ELSE 0 END
```
✅ **Correction** : `positive_houses_breeding` = `COUNT(DISTINCT CASE WHEN is_positive_site = 1 THEN house_id END)`

---

#### **3️⃣ Indice de Récipient (IR)**
```
(Nombre de gîtes positifs × 100) ÷ Nombre total de gîtes inspectés
```
```sql
CASE WHEN total_sites > 0 
     THEN ROUND((positive_sites::decimal * 100) / total_sites, 2) 
     ELSE 0 END
```
✅ **Correction** : `total_sites` = `COUNT(*)` (toutes les lignes)

---

#### **4️⃣ Indice de Positivité des Pondoirs (IPP)**
```
(Nombre de pièges positifs × 100) ÷ Nombre total de pièges installés
```
```sql
CASE WHEN total_houses_eggs > 0 
     THEN ROUND((positive_houses_eggs::decimal * 100) / total_houses_eggs, 2) 
     ELSE 0 END
```
✅ **Formule correcte** : 1 ligne œufs = 1 maison

---

#### **5️⃣ Indice de Colonisation Nymphale (ICN)**
```
(Nombre de maisons infestées de nymphes × 100) ÷ Nombre total de maisons inspectées
```
```sql
CASE WHEN total_houses_breeding > 0 
     THEN ROUND((positive_houses_nymphs::decimal * 100) / total_houses_breeding, 2) 
     ELSE 0 END
```
✅ **Correction** : `positive_houses_nymphs` = `COUNT(DISTINCT CASE WHEN nymphs_count > 0 THEN house_id END)`

---

#### **6️⃣ Indice Adultes par Piège BG (IAP BG)**
```
Nombre total d'adultes capturés (BG) ÷ Nombre total de pièges BG installés
```
```sql
CASE WHEN total_bg_traps_count > 0 
     THEN ROUND(total_bg_trap::decimal / total_bg_traps_count, 2) 
     ELSE 0 END
```
✅ **Correction** : Utilise le nouveau champ `bg_traps_count` au lieu de compter les lignes

---

#### **7️⃣ Indice Adultes par Piège Prokopack (IAP Prokopack)**
```
Nombre total d'adultes capturés (Prokopack) ÷ Nombre total de pièges Prokopack installés
```
```sql
CASE WHEN total_prokopack_traps_count > 0 
     THEN ROUND(total_prokopack::decimal / total_prokopack_traps_count, 2) 
     ELSE 0 END
```
✅ **Correction** : Utilise le nouveau champ `prokopack_traps_count`

---

### 3. ✅ **Structure SQL Optimisée avec CTEs**

#### **CTE 1 : Données Gîtes Larvaires (par gîte individuel)**
```sql
WITH b AS (
    SELECT 
        to_char(date_trunc('month', b.visit_date), 'YYYY-MM') AS periode,
        b.house_id,  -- ✅ FK vers houses.id
        CASE WHEN b.site_state = 'positive' THEN 1 ELSE 0 END AS is_positive_site,
        b.larvae_count,
        b.nymphs_count
    FROM breeding_sites b
    WHERE b.status = 'approved'
)
```

#### **CTE 2 : Agrégation Gîtes**
```sql
b_g AS (
    SELECT 
        periode,
        COUNT(DISTINCT house_id) AS total_houses_breeding,  -- ✅ Compte les maisons
        COUNT(DISTINCT CASE WHEN is_positive_site = 1 THEN house_id END) AS positive_houses_breeding,
        COUNT(*) AS total_sites,  -- ✅ Compte les gîtes
        SUM(is_positive_site) AS positive_sites,  -- ✅ Compte les gîtes positifs
        SUM(larvae_count) AS total_larvae,
        SUM(nymphs_count) AS total_nymphs,
        COUNT(DISTINCT CASE WHEN nymphs_count > 0 THEN house_id END) AS positive_houses_nymphs
    FROM b 
    GROUP BY periode
)
```

#### **CTE 5 : Données Moustiques (simplifié)**
```sql
m_g AS (
    SELECT 
        periode,
        COUNT(DISTINCT house_id) AS total_houses_mosquitoes,  -- ✅ Simple !
        SUM(total_mosquitoes_count) AS total_mosquitoes,
        SUM(bg_traps_count) AS total_bg_traps_count,  -- ✅ Nouveau champ
        SUM(prokopack_traps_count) AS total_prokopack_traps_count  -- ✅ Nouveau champ
    FROM m 
    GROUP BY periode
)
```

---

### 4. ✅ **Mise à Jour de `server.js`**

```javascript
// AVANT
const apiIndicesRoutes = require('./routes/api-indices');

// APRÈS
const apiIndicesRoutes = require('./routes/api-indices-normalized');
```

---

### 5. ✅ **Modifications Frontend**

#### **A. Changement d'unité : `public/js/indices.js`**
```javascript
// AVANT
case 'iap_bg':
case 'iap_prokopack':
    return `${formattedValue} moustiques`;

// APRÈS
case 'iap_bg':
case 'iap_prokopack':
    return `${formattedValue} mosquitoes`;
```

#### **B. Disposition des cartes : `public/indices.html`**
```html
<!-- AVANT : 3 colonnes (3 lignes pour 7 cartes) -->
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

<!-- APRÈS : 4 colonnes (2 lignes pour 7 cartes) -->
<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
```

**Résultat** :
- **Ligne 1** : 4 cartes (IB, IM, IR, IPP)
- **Ligne 2** : 3 cartes (ICN, IAP BG, IAP Prokopack)

---

## 🔍 POINTS CLÉS DE LA CORRECTION

### ✅ **Comptage Correct des Maisons**

| Type de Collecte | Ancienne Méthode | Nouvelle Méthode | Résultat |
|------------------|------------------|------------------|----------|
| **Œufs** | `COUNT(DISTINCT concession_code)` | `COUNT(DISTINCT house_id)` | ✅ Correct (1 ligne = 1 maison) |
| **Gîtes** | `COUNT(DISTINCT concession_code/house_code)` | `COUNT(DISTINCT house_id)` | ✅ **Corrigé !** Plusieurs gîtes dans 1 maison |
| **Moustiques** | `COUNT / 2` (approximation) | `COUNT(DISTINCT house_id)` | ✅ **Corrigé !** 4 lignes peuvent = 1 maison |

---

### ✅ **Gestion des Gîtes Positifs**

**Ancienne structure** :
- Champs `total_sites_count`, `positive_sites_count` (agrégés par maison)
- Problème : Perte de granularité

**Nouvelle structure** :
- Champ `site_state` = 'positive' ou 'negative' (par gîte individuel)
- Solution : Agrégation dans la requête SQL
  - `COUNT(*)` = Nombre total de gîtes
  - `SUM(CASE WHEN site_state = 'positive' THEN 1 ELSE 0 END)` = Gîtes positifs

---

### ✅ **Simplification des Calculs Moustiques**

**Ancienne logique** :
```sql
CASE 
    WHEN COUNT(DISTINCT house_id) = 1 THEN 1
    WHEN COUNT(DISTINCT house_id) = 2 THEN 1
    ELSE COUNT(DISTINCT house_id) / 2
END AS total_houses_mosquitoes
```
❌ Trop complexe et approximatif

**Nouvelle logique** :
```sql
COUNT(DISTINCT house_id) AS total_houses_mosquitoes
```
✅ Simple et correct car chaque ligne a un `house_id` (FK vers `houses.id`)

---

### ✅ **Nouveaux Champs pour Pièges**

Au lieu de compter les lignes :
```sql
-- ❌ AVANT
SUM(CASE WHEN bg_trap_mosquitoes_count IS NOT NULL THEN 1 ELSE 0 END) AS total_bg_traps_count
```

On utilise les nouveaux champs :
```sql
-- ✅ APRÈS
SUM(bg_traps_count) AS total_bg_traps_count
SUM(prokopack_traps_count) AS total_prokopack_traps_count
```

---

## 📈 RÉSULTATS ATTENDUS

### **Avec les Données Fictives Générées**

D'après `scripts/seed-fake-data.js` :
- **50 maisons** créées
- **720 gîtes larvaires** (plusieurs gîtes par maison)
- **151 collectes de moustiques adultes**

### **Calcul Exemple : Indice de Breteau**

**Scénario** :
- 50 maisons visitées
- 720 gîtes inspectés
- 504 gîtes positifs (70%)

**Calcul** :
```
IB = (504 × 100) ÷ 50 = 1008%
```

Cela paraît élevé, mais c'est **normal** car :
- L'indice de Breteau peut dépasser 100%
- Il mesure le nombre de gîtes positifs **par 100 maisons**
- Un IB > 100 signifie en moyenne **plus de 1 gîte positif par maison**

---

## 🚀 INSTRUCTIONS DE TEST

### 1. **Redémarrer le Serveur**
```bash
# Arrêter le serveur existant
Get-Process -Name node | Stop-Process -Force

# Démarrer le nouveau serveur
node server.js
```

### 2. **Ouvrir la Page Indices**
```
http://localhost:3000/indices.html
```

### 3. **Vérifications**

#### ✅ **Affichage des Cartes**
- Les 7 cartes doivent s'afficher sur **2 lignes** (4 + 3)
- Les valeurs doivent être des nombres (pas "--")
- Les unités doivent être correctes :
  - IB, IM, IR, IPP, ICN : **%**
  - IAP BG, IAP Prokopack : **mosquitoes**

#### ✅ **Sélecteur de Mois**
- Le dropdown doit afficher les mois disponibles
- Sélectionner un mois doit mettre à jour les cartes

#### ✅ **Tableau des Indices**
- Le tableau doit afficher tous les mois
- La pagination doit fonctionner
- Les valeurs doivent être cohérentes avec les cartes

#### ✅ **Console du Navigateur (F12)**
Vérifier qu'il n'y a pas d'erreurs JavaScript

---

## 🔍 VÉRIFICATION DE LA COHÉRENCE

### **Tester avec une Requête SQL Directe**

```sql
-- Vérifier le nombre de maisons avec gîtes
SELECT COUNT(DISTINCT house_id) 
FROM breeding_sites 
WHERE status = 'approved';

-- Vérifier le nombre total de gîtes
SELECT COUNT(*) 
FROM breeding_sites 
WHERE status = 'approved';

-- Vérifier le nombre de gîtes positifs
SELECT COUNT(*) 
FROM breeding_sites 
WHERE status = 'approved' AND site_state = 'positive';
```

---

## ✅ AVANTAGES DE LA NOUVELLE STRUCTURE

| Avantage | Description |
|----------|-------------|
| **🎯 Précision** | Comptage exact des maisons (pas d'approximations) |
| **🔍 Granularité** | Données par gîte individuel (plus de détails) |
| **🚀 Performance** | Moins de jointures complexes |
| **🛠️ Maintenabilité** | Code SQL plus clair et documenté |
| **📊 Fiabilité** | Formules standards respectées |
| **✅ Cohérence** | Utilisation de la table centrale `houses` |

---

## 📌 FICHIERS MODIFIÉS

1. ✅ **`routes/api-indices-normalized.js`** (nouveau)
   - Requêtes SQL adaptées à la nouvelle structure
   - Formules correctement implémentées
   - Documentation complète des calculs

2. ✅ **`server.js`**
   - Ligne 14 : `require('./routes/api-indices-normalized')`

3. ✅ **`public/js/indices.js`**
   - Ligne 310 : `mosquitoes` au lieu de `moustiques`

4. ✅ **`public/indices.html`**
   - Ligne 94 : `lg:grid-cols-4` au lieu de `lg:grid-cols-3`

---

## 📚 DOCUMENTATION ASSOCIÉE

- **`ANALYSE_INDICES_ENTOMOLOGIQUES.md`** : Analyse détaillée des problèmes
- **`routes/api-indices-normalized.js`** : Code source avec commentaires
- **`scripts/seed-fake-data.js`** : Génération des données de test

---

## ✅ STATUT

**🟢 IMPLÉMENTATION COMPLÈTE**

Toutes les formules ont été implémentées correctement avec la nouvelle structure normalisée. Le système est prêt pour les tests.

---

**Date** : 23 octobre 2025  
**Développeur** : Assistant IA (Claude Sonnet 4.5)  
**Prochaine étape** : Tester avec les données fictives et vérifier les résultats

