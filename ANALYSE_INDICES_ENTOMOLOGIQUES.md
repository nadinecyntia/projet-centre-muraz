# 📊 ANALYSE COMPLÈTE : SYSTÈME DE CALCUL DES INDICES ENTOMOLOGIQUES

Date : 23 octobre 2025

---

## 🎯 CONTEXTE ET PROBLÉMATIQUE

### ⚠️ **PROBLÈME MAJEUR IDENTIFIÉ**

Les calculs d'indices entomologiques se basent généralement sur le **nombre de maisons visitées**, mais la structure actuelle de la base de données pose un problème critique :

| Type de collecte | Structure actuelle | Correspondance | ❌ Problème |
|-----------------|-------------------|----------------|-------------|
| **Œufs** | 1 ligne = 1 visite maison | ✅ 1 ligne = 1 maison | **OK** |
| **Gîtes larvaires** | 1 ligne = 1 gîte individuel | ❌ 1 ligne ≠ 1 maison | **CRITIQUE** |
| **Moustiques adultes** | 1 ligne = 1 collecte (méthode × location) | ❌ 4 lignes = 1 maison | **CRITIQUE** |

### 📌 Impact sur les Calculs

Pour les gîtes larvaires :
- **Plusieurs gîtes** peuvent avoir le **même code de concession**
- Compter les lignes ≠ Compter les maisons
- **Exemple** : 5 gîtes dans la même maison = 5 lignes, mais **1 seule maison**

Pour les moustiques adultes :
- **4 enregistrements par maison** (2 méthodes × 2 locations)
  - Prokopack Intérieur
  - Prokopack Extérieur
  - BG Trap Intérieur
  - BG Trap Extérieur
- Compter les lignes ÷ 4 = Approximativement le nombre de maisons

---

## 📋 ANALYSE DU SYSTÈME ACTUEL

### 1. ⚠️ API UTILISE ENCORE LES ANCIENNES TABLES

**Fichier** : `routes/api-indices.js`

```javascript
const tables = {
    eggs: isArchiveQuery ? 'eggs_collection_archive' : 'eggs_collection_new',
    breeding: isArchiveQuery ? 'breeding_sites_archive' : 'breeding_sites_new',
    mosquitoes: isArchiveQuery ? 'adult_mosquitoes_archive' : 'adult_mosquitoes_new'
};
```

🔴 **Problème** : Le système utilise toujours les **anciennes tables dénormalisées** (`eggs_collection_new`, `breeding_sites_new`, `adult_mosquitoes_new`), alors que nous avons créé une **nouvelle structure normalisée** avec :
- `houses` (table centrale)
- `eggs_collections`
- `breeding_sites`
- `adult_mosquitoes_collections`

---

### 2. 📊 INDICES CALCULÉS ACTUELLEMENT

#### **A. Indice de Breteau (IB)**
```sql
(Nombre de gîtes positifs × 100) ÷ Nombre de maisons visitées
```
**Ligne 152** : 
```sql
CASE WHEN total_houses_breeding > 0 
     THEN ROUND((positive_sites::decimal * 100) / total_houses_breeding, 2) 
     ELSE 0 END AS breteau_index
```

❌ **Problème actuel** : 
- `positive_sites` = Nombre de gîtes positifs (correct)
- `total_houses_breeding` = `COUNT(DISTINCT house_id)` où `house_id = (site_concession_code || '/' || site_house_code)`
- **Mais** : Dans la nouvelle structure, 1 ligne ≠ 1 maison !

---

#### **B. Indice de Maison (IM)**
```sql
(Nombre de maisons avec au moins 1 gîte positif × 100) ÷ Nombre total de maisons visitées
```
**Ligne 155** :
```sql
CASE WHEN total_houses_breeding > 0 
     THEN ROUND((positive_houses_breeding::decimal * 100) / total_houses_breeding, 2) 
     ELSE 0 END AS house_index_breeding
```

✅ **Calcul correct** pour ce qui est, mais le `total_houses_breeding` est mal compté.

---

#### **C. Indice de Récipient (IR)**
```sql
(Nombre de gîtes positifs × 100) ÷ Nombre total de gîtes inspectés
```
**Ligne 158** :
```sql
CASE WHEN total_sites > 0 
     THEN ROUND((positive_sites::decimal * 100) / total_sites, 2) 
     ELSE 0 END AS container_index
```

✅ **Calcul correct** (basé sur les gîtes, pas les maisons)

---

#### **D. Indice de Positivité des Pondoirs (IPP)**
```sql
(Nombre de pièges positifs × 100) ÷ Nombre total de pièges installés
```
**Ligne 161** :
```sql
CASE WHEN total_houses_eggs > 0 
     THEN ROUND((positive_houses_eggs::decimal * 100) / total_houses_eggs, 2) 
     ELSE 0 END AS pondoir_positivity_index
```

✅ **Calcul correct** (1 ligne œufs = 1 maison)

---

#### **E. Indice de Colonisation Nymphale (ICN)**
```sql
(Nombre de maisons infestées de nymphes × 100) ÷ Nombre total de maisons inspectées
```
**Ligne 164** :
```sql
CASE WHEN total_houses_breeding > 0 
     THEN ROUND((positive_houses_nymphs::decimal * 100) / total_houses_breeding, 2) 
     ELSE 0 END AS nymphal_colonization_index
```

❌ **Problème** : `total_houses_breeding` est mal compté (cf. problème A)

---

#### **F. Indice Adultes par Piège BG (IAP BG)**
```sql
Nombre total d'adultes capturés (BG) ÷ Nombre total de pièges BG installés
```
**Ligne 167** :
```sql
CASE WHEN total_bg_traps_count > 0 
     THEN ROUND(total_bg_trap::decimal / total_bg_traps_count, 2) 
     ELSE 0 END AS mosquitoes_bg_per_house
```

✅ **Calcul correct** (basé sur le nombre de pièges, pas les maisons)

---

#### **G. Indice Adultes par Piège Prokopack (IAP Prokopack)**
```sql
Nombre total d'adultes capturés (Prokopack) ÷ Nombre total de pièges Prokopack installés
```
**Ligne 170** :
```sql
CASE WHEN total_prokopack_traps_count > 0 
     THEN ROUND(total_prokopack::decimal / total_prokopack_traps_count, 2) 
     ELSE 0 END AS mosquitoes_prokopack_per_house
```

✅ **Calcul correct** (basé sur le nombre de pièges)

---

## 🔍 ANALYSE DÉTAILLÉE DES CTE (Common Table Expressions)

### CTE `b` - Données Gîtes Larvaires
```sql
b AS (
    SELECT 
        to_char(date_trunc('month', site_visit_start_date), 'YYYY-MM') AS periode,
        (site_concession_code || '/' || site_house_code) AS house_id,
        total_sites_count,
        positive_sites_count,
        larvae_count,
        nymphs_count
    FROM breeding_sites_new bs
    WHERE bs.status='approved'
)
```

❌ **Problème** :
1. Utilise `breeding_sites_new` (ancienne table)
2. `house_id = (site_concession_code || '/' || site_house_code)`
3. **Mais** : Dans la nouvelle structure, `site_house_code` n'existe pas dans `breeding_sites` ! Il est dans `houses`.

---

### CTE `b_g` - Agrégation Gîtes
```sql
b_g AS (
    SELECT 
        periode,
        COUNT(DISTINCT house_id) AS total_houses_breeding,  -- ❌ PROBLÈME
        COUNT(DISTINCT CASE WHEN positive_sites_count > 0 THEN house_id END) AS positive_houses_breeding,
        SUM(total_sites_count) AS total_sites,
        SUM(positive_sites_count) AS positive_sites,
        SUM(larvae_count) AS total_larvae,
        SUM(nymphs_count) AS total_nymphs,
        COUNT(DISTINCT CASE WHEN nymphs_count > 0 THEN house_id END) AS positive_houses_nymphs
    FROM b GROUP BY 1
)
```

❌ **Problème critique** :
- `COUNT(DISTINCT house_id)` compte les **combinaisons uniques** de `concession_code/house_code`
- **Mais** : Une ligne = 1 gîte, pas 1 maison
- **Solution** : Utiliser `JOIN` avec `houses` et compter `house_id` de la table `houses`

---

### CTE `m` - Données Moustiques Adultes
```sql
m AS (
    SELECT
        to_char(date_trunc('month', mosquitoes_visit_start_date), 'YYYY-MM') AS periode,
        mosquitoes_concession_code AS house_id,
        total_mosquitoes_count,
        ...
    FROM adult_mosquitoes_new am
    WHERE am.status='approved'
)
```

❌ **Problème** :
1. Utilise `adult_mosquitoes_new` (ancienne table)
2. `house_id = mosquitoes_concession_code` uniquement (pas de house_code)
3. Dans la nouvelle structure, il faut utiliser `house_id` de la table `adult_mosquitoes_collections`

---

### CTE `m_g` - Agrégation Moustiques (Tentative de Correction)
```sql
m_g AS (
    SELECT 
        periode,
        -- Logique pour compter les maisons :
        CASE 
            WHEN COUNT(DISTINCT house_id) = 1 THEN 1
            WHEN COUNT(DISTINCT house_id) = 2 THEN 1
            ELSE COUNT(DISTINCT house_id) / 2
        END AS total_houses_mosquitoes,  -- ❌ APPROXIMATION
        ...
    FROM m GROUP BY 1
)
```

⚠️ **Tentative de correction** : Le code essaie de gérer le fait que 4 lignes = 1 maison, mais c'est une **approximation grossière** :
- Si `COUNT(DISTINCT house_id) = 1` → 1 maison ✅
- Si `COUNT(DISTINCT house_id) = 2` → 1 maison ⚠️ (pourquoi ?)
- Sinon → `COUNT / 2` ❌ (devrait être `/ 4`)

---

## 🎯 PROBLÈMES IDENTIFIÉS

### 1. 🔴 **Utilisation des Anciennes Tables**
L'API utilise :
- `eggs_collection_new`
- `breeding_sites_new`
- `adult_mosquitoes_new`

Alors que la **nouvelle structure normalisée** utilise :
- `houses` (table centrale)
- `eggs_collections`
- `breeding_sites`
- `adult_mosquitoes_collections`

---

### 2. 🔴 **Comptage Incorrect des Maisons pour Gîtes**

**Problème** : `COUNT(DISTINCT house_id)` compte les lignes, pas les maisons.

**Impact** : 
- Si 5 gîtes dans la maison "CONC-001" → `COUNT = 5` au lieu de `COUNT = 1`
- **Indice de Breteau surestimé**
- **Indice de Maison sous-estimé**

**Solution** : Utiliser `JOIN` avec `houses` et compter `DISTINCT breeding_sites.house_id`

---

### 3. 🔴 **Comptage Approximatif des Maisons pour Moustiques**

**Problème** : La logique `COUNT / 2` n'est pas correcte.

**Impact** :
- Si 4 lignes pour 1 maison → `COUNT = 4 / 2 = 2` maisons ❌ (devrait être 1)
- **Indices de moustiques faussés**

**Solution** : Compter `DISTINCT adult_mosquitoes_collections.house_id`

---

### 4. 🔴 **Champs Manquants dans la Nouvelle Structure**

Dans la nouvelle structure normalisée :
- `breeding_sites` n'a **pas** de colonnes `total_sites_count`, `positive_sites_count`
- Ces champs étaient dans l'ancienne structure dénormalisée
- **Solution** : Compter les gîtes par maison dans la requête SQL

---

### 5. 🔴 **Absence de `site_state` dans les Calculs**

Dans la nouvelle structure :
- `breeding_sites.site_state` = 'positive' ou 'negative'
- Permet de savoir si un gîte individuel est positif
- **Solution** : Compter les gîtes avec `site_state = 'positive'`

---

## 💡 PROPOSITIONS DE CORRECTION

### A. **Adapter l'API pour Utiliser les Nouvelles Tables**

**Fichier à modifier** : `routes/api-indices.js`

```javascript
// AVANT (ligne 24-27)
const tables = {
    eggs: isArchiveQuery ? 'eggs_collection_archive' : 'eggs_collection_new',
    breeding: isArchiveQuery ? 'breeding_sites_archive' : 'breeding_sites_new',
    mosquitoes: isArchiveQuery ? 'adult_mosquitoes_archive' : 'adult_mosquitoes_new'
};

// APRÈS
const tables = {
    eggs: isArchiveQuery ? 'eggs_collections_archive' : 'eggs_collections',
    breeding: isArchiveQuery ? 'breeding_sites_archive' : 'breeding_sites',
    mosquitoes: isArchiveQuery ? 'adult_mosquitoes_collections_archive' : 'adult_mosquitoes_collections',
    houses: 'houses' // Nouvelle table centrale
};
```

---

### B. **Corriger le CTE pour Gîtes Larvaires**

```sql
-- AVANT (lignes 35-44)
b AS (
    SELECT 
        to_char(date_trunc('month', site_visit_start_date), 'YYYY-MM') AS periode,
        (site_concession_code || '/' || site_house_code) AS house_id,
        total_sites_count,
        positive_sites_count,
        larvae_count,
        nymphs_count
    FROM breeding_sites_new bs
    WHERE bs.status='approved'
)

-- APRÈS
b AS (
    SELECT 
        to_char(date_trunc('month', b.visit_date), 'YYYY-MM') AS periode,
        b.house_id,
        CASE WHEN b.site_state = 'positive' THEN 1 ELSE 0 END AS is_positive,
        b.larvae_count,
        b.nymphs_count
    FROM breeding_sites b
    WHERE b.status='approved'
)
```

---

### C. **Corriger l'Agrégation des Gîtes**

```sql
-- APRÈS
b_g AS (
    SELECT 
        periode,
        COUNT(DISTINCT house_id) AS total_houses_breeding,  -- ✅ Maintenant correct
        COUNT(DISTINCT CASE WHEN is_positive = 1 THEN house_id END) AS positive_houses_breeding,
        COUNT(*) AS total_sites,  -- Nombre total de gîtes inspectés
        SUM(is_positive) AS positive_sites,  -- Nombre de gîtes positifs
        SUM(larvae_count) AS total_larvae,
        SUM(nymphs_count) AS total_nymphs,
        COUNT(DISTINCT CASE WHEN nymphs_count > 0 THEN house_id END) AS positive_houses_nymphs
    FROM b GROUP BY 1
)
```

**Changements** :
- `COUNT(DISTINCT house_id)` maintenant basé sur le `house_id` de la table `houses` ✅
- `COUNT(*)` = Nombre total de gîtes (pas `SUM(total_sites_count)`)
- `SUM(is_positive)` = Nombre de gîtes positifs

---

### D. **Corriger le CTE pour Moustiques Adultes**

```sql
-- APRÈS
m AS (
    SELECT
        to_char(date_trunc('month', m.visit_date), 'YYYY-MM') AS periode,
        m.house_id,
        m.total_mosquitoes_count,
        m.male_count,
        m.female_count,
        m.blood_fed_females_count,
        m.gravid_females_count,
        m.starved_females_count,
        m.bg_trap_mosquitoes_count,
        m.prokopack_mosquitoes_count,
        m.bg_traps_count,
        m.prokopack_traps_count
    FROM adult_mosquitoes_collections m
    WHERE m.status='approved'
)
```

---

### E. **Corriger l'Agrégation des Moustiques**

```sql
-- APRÈS
m_g AS (
    SELECT 
        periode,
        COUNT(DISTINCT house_id) AS total_houses_mosquitoes,  -- ✅ Simplifié !
        SUM(total_mosquitoes_count) AS total_mosquitoes,
        SUM(male_count) AS total_males,
        SUM(female_count) AS total_females,
        SUM(blood_fed_females_count) AS blood_fed_females,
        SUM(gravid_females_count) AS gravid_females,
        SUM(starved_females_count) AS starved_females,
        SUM(bg_trap_mosquitoes_count) AS total_bg_trap,
        SUM(prokopack_mosquitoes_count) AS total_prokopack,
        SUM(bg_traps_count) AS total_bg_traps_count,
        SUM(prokopack_traps_count) AS total_prokopack_traps_count
    FROM m GROUP BY 1
)
```

**Changements** :
- ✅ Suppression de la logique `CASE WHEN COUNT = 1 THEN 1 WHEN COUNT = 2 THEN 1 ELSE COUNT / 2`
- ✅ Simple `COUNT(DISTINCT house_id)` car chaque ligne a maintenant un `house_id` référençant `houses.id`
- ✅ Utilise les nouveaux champs `bg_traps_count` et `prokopack_traps_count` au lieu de compter les lignes

---

### F. **Corriger le CTE pour Œufs**

```sql
-- APRÈS
e AS (
    SELECT
        to_char(date_trunc('month', e.visit_date), 'YYYY-MM') AS periode,
        e.house_id,
        e.eggs_count
    FROM eggs_collections e
    WHERE e.status='approved'
)

e_g AS (
    SELECT 
        periode,
        COUNT(DISTINCT house_id) AS total_houses_eggs,
        SUM(eggs_count) AS total_eggs,
        COUNT(DISTINCT CASE WHEN eggs_count > 0 THEN house_id END) AS positive_houses_eggs
    FROM e GROUP BY 1
)
```

**Changements** :
- ✅ Utilise `eggs_collections` au lieu de `eggs_collection_new`
- ✅ Suppression des champs `eggs_household_size` et `eggs_sleeping_unit_count` (dans `houses`)

---

## 📌 RÉSUMÉ DES CORRECTIONS NÉCESSAIRES

### 1. ✅ **Migrations des Tables**
- `eggs_collection_new` → `eggs_collections`
- `breeding_sites_new` → `breeding_sites`
- `adult_mosquitoes_new` → `adult_mosquitoes_collections`

### 2. ✅ **Utilisation de la Table `houses`**
- Toutes les tables de collecte ont un `house_id` (FK vers `houses.id`)
- Compter `DISTINCT house_id` au lieu de `DISTINCT concession_code`

### 3. ✅ **Suppression des Champs Dénormalisés**
- `total_sites_count` → Calculé avec `COUNT(*)`
- `positive_sites_count` → Calculé avec `SUM(CASE WHEN site_state = 'positive' THEN 1 ELSE 0 END)`

### 4. ✅ **Simplification de la Logique Moustiques**
- Suppression de `CASE WHEN COUNT = 1 THEN 1 ... ELSE COUNT / 2`
- Simple `COUNT(DISTINCT house_id)`

### 5. ✅ **Ajout des Nouveaux Champs**
- `bg_traps_count` et `prokopack_traps_count` pour compter les pièges installés
- Plus besoin de compter les lignes avec `SUM(CASE WHEN ... IS NOT NULL THEN 1 ...)`

---

## 🚀 PLAN D'ACTION RECOMMANDÉ

### Étape 1 : **Créer un Nouveau Fichier API**
- `routes/api-indices-normalized.js`
- Adapter toutes les requêtes SQL pour utiliser la nouvelle structure

### Étape 2 : **Tester avec les Données Fictives**
- Utiliser `scripts/seed-fake-data.js` pour générer des données
- Vérifier que les indices sont cohérents

### Étape 3 : **Mettre à Jour `routes/api.js`**
- Pointer vers `api-indices-normalized.js`

### Étape 4 : **Tester le Frontend**
- Ouvrir `http://localhost:3000/indices.html`
- Vérifier que les cartes et le tableau affichent correctement

### Étape 5 : **Documentation**
- Documenter les formules de calcul
- Créer un guide pour l'interprétation des indices

---

## ✅ CONCLUSION

Le système actuel présente des **incohérences majeures** dans le comptage des maisons pour les calculs d'indices entomologiques. L'adaptation vers la **nouvelle structure normalisée** permettra :

1. ✅ **Comptage correct des maisons** (basé sur `houses.id`)
2. ✅ **Simplification des requêtes SQL** (pas d'approximations)
3. ✅ **Cohérence des calculs** (formules standards)
4. ✅ **Maintenabilité** (code plus clair et documenté)

**Statut** : 🔴 **CORRECTIONS NÉCESSAIRES AVANT UTILISATION EN PRODUCTION**

---

**Date d'analyse** : 23 octobre 2025  
**Analyste** : Assistant IA (Claude Sonnet 4.5)  
**Prochaine étape** : Adapter `routes/api-indices.js` vers `routes/api-indices-normalized.js`

