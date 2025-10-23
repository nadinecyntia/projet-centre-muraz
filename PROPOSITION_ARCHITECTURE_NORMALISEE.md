# 🏗️ PROPOSITION D'ARCHITECTURE NORMALISÉE
## Centre MURAZ - Plateforme de Surveillance Arboviroses

---

## 📌 PRINCIPES CLÉS
> **Les calculs se font en fonction du nombre de maisons**
> 
> **Chaque collecte (œufs, gîtes, moustiques) se fait à des moments différents**
> - Les collectes sont INDÉPENDANTES les unes des autres
> - Chaque collecte a sa propre date/heure
> - Une maison peut avoir plusieurs collectes à différentes dates

---

## 🏠 1. TABLE CENTRALE : `houses` (Maisons)

### Structure
```sql
CREATE TABLE houses (
    id SERIAL PRIMARY KEY,
    
    -- Informations OBLIGATOIRES (communes à toutes les collectes)
    concession_code VARCHAR(50) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('urban', 'rural')),
    gps_coordinates VARCHAR(100),  -- Format: "lat,lng" - Optionnel mais recommandé
    
    -- Informations OPTIONNELLES (spécifiques à breeding_sites)
    house_code VARCHAR(50),  -- Utilisé uniquement pour breeding_sites
    household_size INTEGER CHECK (household_size >= 0),
    sleeping_unit_count INTEGER CHECK (sleeping_unit_count >= 0),
    head_contact VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index unique pour éviter les doublons
    UNIQUE(concession_code, sector)
);

CREATE INDEX idx_houses_sector ON houses(sector);
CREATE INDEX idx_houses_environment ON houses(environment);
CREATE INDEX idx_houses_concession ON houses(concession_code);
```

**Justification :**
- Une maison est identifiée **UNIQUEMENT** par : `concession_code + sector`
- Le `house_code` est optionnel (utilisé seulement pour breeding_sites)
- Les champs `household_size`, `sleeping_unit_count`, `head_contact` sont NULL par défaut
- Ils seront remplis lors de la première collecte breeding_sites
- **Approche "upsert"** : Si la maison existe déjà, on peut mettre à jour les champs optionnels

---

## 🥚 2. TABLE : `eggs_collections` (Collecte d'œufs)

### Structure actuelle → Problème
**Actuellement** : `nest_number`, `nest_code`, `pass_order` suggèrent une collecte par nid, mais vous dites "1 ligne = 1 maison"

### Proposition : **1 ligne = 1 visite pour collecter des œufs dans une maison**

```sql
CREATE TABLE eggs_collections (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    
    -- Informations de visite
    visit_date DATE NOT NULL,
    investigator_name VARCHAR(100),
    
    -- Données d'œufs
    nest_number VARCHAR(50),      -- Numéro du nid/piège
    nest_code VARCHAR(50),        -- Code du nid
    pass_order VARCHAR(50),       -- Ordre de passage
    eggs_count INTEGER NOT NULL CHECK (eggs_count >= 0),
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    
    -- Validation
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    
    -- Traçabilité
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eggs_house ON eggs_collections(house_id);
CREATE INDEX idx_eggs_date ON eggs_collections(visit_date);
CREATE INDEX idx_eggs_status ON eggs_collections(status);
```

**Changements frontend nécessaires :**

### 🔄 NOUVEAU WORKFLOW (sans supprimer les champs du formulaire)

**L'utilisateur saisit toujours les mêmes champs :**
- `eggs_concession_code` ✅ (gardé au front)
- `eggs_sector` ✅ (gardé au front)
- `eggs_environment` ✅ (gardé au front)
- `eggs_gps_code` ✅ (gardé au front)
- `visit_date`, `nest_number`, `nest_code`, `pass_order`, `eggs_count`, `observations`

**Côté BACKEND - Logique "Find or Create" :**
```javascript
// 1. Rechercher si la maison existe déjà
const house = await pool.query(
    'SELECT id FROM houses WHERE concession_code = $1 AND sector = $2',
    [eggs_concession_code, eggs_sector]
);

let house_id;
if (house.rows.length > 0) {
    // Maison existe déjà
    house_id = house.rows[0].id;
} else {
    // Créer la maison automatiquement
    const newHouse = await pool.query(
        'INSERT INTO houses (concession_code, sector, environment, gps_coordinates) VALUES ($1, $2, $3, $4) RETURNING id',
        [eggs_concession_code, eggs_sector, eggs_environment, eggs_gps_code]
    );
    house_id = newHouse.rows[0].id;
}

// 2. Insérer la collecte d'œufs avec le house_id
await pool.query(
    'INSERT INTO eggs_collections (house_id, visit_date, nest_number, nest_code, pass_order, eggs_count, observations, submitted_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [house_id, visit_date, nest_number, nest_code, pass_order, eggs_count, observations, user_id]
);
```

**✅ AVANTAGE : L'interface utilisateur NE CHANGE PAS !**
- Les champs restent les mêmes au frontend
- Le backend gère intelligemment la normalisation
- Pas de redondance en base de données

---

## 🦟 3. TABLE : `breeding_sites` (Gîtes larvaires)

### Structure actuelle → Problème MAJEUR
**Actuellement** : 1 ligne = 1 maison avec totaux agrégés (`total_sites_count`, `positive_sites_count`, etc.)

### Proposition : **1 ligne = 1 gîte larvaire individuel**

```sql
CREATE TABLE breeding_sites (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    
    -- Informations de visite
    visit_date DATE NOT NULL,
    visit_end_date DATE,
    visit_start_time TIME,
    visit_end_time TIME,
    investigator_name VARCHAR(100) NOT NULL,
    
    -- Caractéristiques du gîte
    site_number INTEGER,  -- Numéro du gîte dans cette maison
    site_type VARCHAR(50) CHECK (site_type IN (
        'pneu', 'bidon', 'bassin', 'plate', 'box', 'table', 
        'canari', 'kettle', 'tomato_box', 'bucket', 
        'water_trough', 'gutter', 'chair', 'pot', 'other'
    )),
    site_class VARCHAR(50) CHECK (site_class IN (
        'household_waste', 'abandoned_utensils', 'car_wrecks', 
        'construction_equipment', 'breeding_utensils', 'other'
    )),
    is_positive BOOLEAN NOT NULL,  -- Gîte positif ou négatif
    
    -- Comptage des larves (si gîte positif)
    larvae_count INTEGER DEFAULT 0 CHECK (larvae_count >= 0),
    larvae_genus VARCHAR(20) CHECK (larvae_genus IN ('aedes', 'culex', 'anopheles', 'other')),
    
    -- Comptage des nymphes (si gîte positif)
    nymphs_count INTEGER DEFAULT 0 CHECK (nymphs_count >= 0),
    nymphs_genus VARCHAR(20) CHECK (nymphs_genus IN ('aedes', 'culex', 'anopheles', 'other')),
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    
    -- Validation
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    
    -- Traçabilité
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_breeding_house ON breeding_sites(house_id);
CREATE INDEX idx_breeding_date ON breeding_sites(visit_date);
CREATE INDEX idx_breeding_status ON breeding_sites(status);
CREATE INDEX idx_breeding_positive ON breeding_sites(is_positive);
CREATE INDEX idx_breeding_genus ON breeding_sites(larvae_genus);
```

### 📊 Vue matérialisée pour les totaux par maison (calculés automatiquement)
```sql
CREATE MATERIALIZED VIEW breeding_sites_summary AS
SELECT 
    house_id,
    visit_date,
    investigator_name,
    COUNT(*) as total_sites_count,
    SUM(CASE WHEN is_positive THEN 1 ELSE 0 END) as positive_sites_count,
    SUM(CASE WHEN NOT is_positive THEN 1 ELSE 0 END) as negative_sites_count,
    
    -- Totaux larves par genre
    SUM(CASE WHEN larvae_genus = 'aedes' THEN larvae_count ELSE 0 END) as aedes_larvae_count,
    SUM(CASE WHEN larvae_genus = 'culex' THEN larvae_count ELSE 0 END) as culex_larvae_count,
    SUM(CASE WHEN larvae_genus = 'anopheles' THEN larvae_count ELSE 0 END) as anopheles_larvae_count,
    SUM(CASE WHEN larvae_genus = 'other' THEN larvae_count ELSE 0 END) as other_larvae_count,
    SUM(larvae_count) as total_larvae_count,
    
    -- Totaux nymphes par genre
    SUM(CASE WHEN nymphs_genus = 'aedes' THEN nymphs_count ELSE 0 END) as aedes_nymphs_count,
    SUM(CASE WHEN nymphs_genus = 'culex' THEN nymphs_count ELSE 0 END) as culex_nymphs_count,
    SUM(CASE WHEN nymphs_genus = 'anopheles' THEN nymphs_count ELSE 0 END) as anopheles_nymphs_count,
    SUM(CASE WHEN nymphs_genus = 'other' THEN nymphs_count ELSE 0 END) as other_nymphs_count,
    SUM(nymphs_count) as total_nymphs_count,
    
    -- Types et classes de gîtes présents (arrays)
    array_agg(DISTINCT site_type) FILTER (WHERE site_type IS NOT NULL) as site_types,
    array_agg(DISTINCT site_class) FILTER (WHERE site_class IS NOT NULL) as site_classes,
    array_agg(DISTINCT larvae_genus) FILTER (WHERE larvae_genus IS NOT NULL) as larvae_genera,
    array_agg(DISTINCT nymphs_genus) FILTER (WHERE nymphs_genus IS NOT NULL) as nymphs_genera
    
FROM breeding_sites
WHERE status = 'validated'
GROUP BY house_id, visit_date, investigator_name;

CREATE INDEX idx_breeding_summary_house ON breeding_sites_summary(house_id);
CREATE INDEX idx_breeding_summary_date ON breeding_sites_summary(visit_date);
```

**Changements frontend nécessaires :**
- 🔄 **CHANGEMENT MAJEUR** : Au lieu d'un seul formulaire, créer une **interface de saisie répétitive** :
  1. Sélectionner/créer la maison
  2. Pour chaque gîte trouvé dans cette maison :
     - Saisir : site_type, site_class, is_positive
     - Si positif : saisir larvae_count, larvae_genus, nymphs_count, nymphs_genus
  3. Bouton "Ajouter un autre gîte" ou "Terminer"
- ❌ Supprimer tous les champs de totaux agrégés (calculés automatiquement côté serveur)
- ❌ Supprimer les multi-selects `larvae_genus[]`, `nymphs_genus[]` (un gîte = un genre dominant)

---

## 🦟 4. TABLE : `adult_mosquitoes_collections` (Collecte de moustiques adultes)

### Structure actuelle → Problème
**Actuellement** : Un seul formulaire mélange toutes les méthodes et localisations

### Proposition : **1 ligne = 1 collecte spécifique (méthode × localisation)**

Pour UNE maison, on peut avoir jusqu'à **4 enregistrements** :
1. Prokopack × Intérieur
2. Prokopack × Extérieur
3. BG-trap × Intérieur
4. BG-trap × Extérieur

```sql
CREATE TABLE adult_mosquitoes_collections (
    id SERIAL PRIMARY KEY,
    house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
    
    -- Informations de collecte
    visit_date DATE NOT NULL,
    visit_start_time TIME NOT NULL,
    visit_end_time TIME NOT NULL,
    investigator_name VARCHAR(100),
    
    -- Méthode et localisation (COMBINAISON UNIQUE par maison/date)
    collection_method VARCHAR(20) NOT NULL CHECK (collection_method IN ('prokopack', 'bg_trap', 'other')),
    capture_location VARCHAR(20) NOT NULL CHECK (capture_location IN ('interior', 'exterior')),
    traps_count INTEGER DEFAULT 1 CHECK (traps_count >= 0),
    
    -- Métadonnées
    observations TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
    
    -- Validation
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    
    -- Traçabilité
    submitted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte : Une seule collecte par méthode/localisation/maison/date
    UNIQUE(house_id, visit_date, collection_method, capture_location)
);

CREATE INDEX idx_mosquitoes_house ON adult_mosquitoes_collections(house_id);
CREATE INDEX idx_mosquitoes_date ON adult_mosquitoes_collections(visit_date);
CREATE INDEX idx_mosquitoes_status ON adult_mosquitoes_collections(status);
CREATE INDEX idx_mosquitoes_method ON adult_mosquitoes_collections(collection_method);
CREATE INDEX idx_mosquitoes_location ON adult_mosquitoes_collections(capture_location);
```

---

## 🦟 5. TABLE : `mosquito_specimens` (Spécimens individuels de moustiques)

### Proposition : **1 ligne = 1 moustique ou groupe de moustiques de même type**

```sql
CREATE TABLE mosquito_specimens (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES adult_mosquitoes_collections(id) ON DELETE CASCADE,
    
    -- Identification taxonomique
    genus VARCHAR(20) NOT NULL CHECK (genus IN ('aedes', 'culex', 'anopheles', 'other')),
    species VARCHAR(50) CHECK (species IN ('aedes_aegypti', 'other_aedes', 'culex', 'anopheles', 'other')),
    
    -- Caractéristiques
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('male', 'female')),
    
    -- État physiologique (femelles uniquement)
    physiological_state VARCHAR(20) CHECK (physiological_state IN ('blood_fed', 'gravid', 'starved', 'unknown')),
    -- Contrainte : physiological_state obligatoire si sex = 'female'
    
    -- Nombre de spécimens identiques (permet de grouper)
    count INTEGER DEFAULT 1 CHECK (count >= 1),
    
    -- Métadonnées
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte : état physiologique uniquement pour les femelles
    CONSTRAINT check_physiological_state 
        CHECK (sex = 'female' OR physiological_state IS NULL)
);

CREATE INDEX idx_specimens_collection ON mosquito_specimens(collection_id);
CREATE INDEX idx_specimens_genus ON mosquito_specimens(genus);
CREATE INDEX idx_specimens_sex ON mosquito_specimens(sex);
CREATE INDEX idx_specimens_state ON mosquito_specimens(physiological_state);
```

### 📊 Vue pour les totaux calculés automatiquement
```sql
CREATE VIEW adult_mosquitoes_summary AS
SELECT 
    c.id as collection_id,
    c.house_id,
    c.visit_date,
    c.collection_method,
    c.capture_location,
    
    -- Totaux généraux
    COALESCE(SUM(s.count), 0) as total_mosquitoes_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male'), 0) as male_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female'), 0) as female_count,
    
    -- Mâles par genre
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male' AND s.genus = 'aedes'), 0) as aedes_male_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male' AND s.genus = 'culex'), 0) as culex_male_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male' AND s.genus = 'anopheles'), 0) as anopheles_male_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'male' AND s.genus = 'other'), 0) as other_male_count,
    
    -- Femelles par état physiologique
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female' AND s.physiological_state = 'blood_fed'), 0) as blood_fed_females_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female' AND s.physiological_state = 'gravid'), 0) as gravid_females_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.sex = 'female' AND s.physiological_state = 'starved'), 0) as starved_females_count,
    
    -- Totaux par genre
    COALESCE(SUM(s.count) FILTER (WHERE s.genus = 'aedes'), 0) as aedes_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.genus = 'culex'), 0) as culex_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.genus = 'anopheles'), 0) as anopheles_count,
    COALESCE(SUM(s.count) FILTER (WHERE s.genus = 'other'), 0) as other_count,
    
    -- Genres et espèces présents
    array_agg(DISTINCT s.genus) FILTER (WHERE s.genus IS NOT NULL) as genera,
    array_agg(DISTINCT s.species) FILTER (WHERE s.species IS NOT NULL) as species_list
    
FROM adult_mosquitoes_collections c
LEFT JOIN mosquito_specimens s ON c.id = s.collection_id
GROUP BY c.id, c.house_id, c.visit_date, c.collection_method, c.capture_location;
```

**Changements frontend nécessaires :**
- 🔄 **CHANGEMENT MAJEUR** : Interface en 2 étapes :
  
  **Étape 1** : Créer la collecte
  - Sélectionner/créer la maison
  - Saisir : visit_date, visit_start_time, visit_end_time
  - Sélectionner : collection_method (prokopack/bg_trap)
  - Sélectionner : capture_location (interior/exterior)
  - Saisir : traps_count
  
  **Étape 2** : Ajouter les spécimens (interface répétitive)
  - Pour chaque groupe de moustiques :
    - Sélectionner : genus, species, sex
    - Si femelle : sélectionner physiological_state
    - Saisir : count (nombre de spécimens identiques)
  - Bouton "Ajouter un autre groupe" ou "Terminer"

- ❌ Supprimer TOUS les champs de totaux (calculés automatiquement)
- ❌ Supprimer les multi-selects pour genus/species (un spécimen = un genre/espèce)

---

## 📊 6. TABLES DE RÉFÉRENCE (Optionnel mais recommandé)

### Secteurs
```sql
CREATE TABLE sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO sectors (name) VALUES 
    ('Sector 6'), ('Sector 9'), ('Sector 22'), ('Sector 26'), ('Sector 33');
```

### Investigateurs
```sql
CREATE TABLE investigators (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE
);
```

---

## 🎯 AVANTAGES DE CETTE ARCHITECTURE

### ✅ Normalisation correcte
- Chaque table a une granularité claire
- Pas de redondance d'information
- Relations propres entre entités

### ✅ Calculs automatisés
- ❌ **AVANT** : L'utilisateur saisissait manuellement les totaux → risque d'erreurs
- ✅ **APRÈS** : Les totaux sont calculés automatiquement par des vues SQL → fiabilité garantie

### ✅ Flexibilité
- Facile d'ajouter de nouvelles méthodes de collecte
- Facile de modifier les genres/espèces
- Facile de faire des analyses fines (par gîte, par méthode, etc.)

### ✅ Intégrité des données
- Contraintes UNIQUE empêchent les doublons
- Contraintes CHECK garantissent la cohérence
- Foreign keys assurent les relations

### ✅ Performance
- Index optimisés pour les requêtes fréquentes
- Vues matérialisées pour les agrégations lourdes

---

## 🔄 PLAN DE DÉPLOIEMENT (PAS DE MIGRATION - FRESH START)

### Phase 1 : Sauvegarder et nettoyer
1. ✅ Sauvegarder les anciennes données (si nécessaire pour référence)
2. ✅ Supprimer les anciennes tables :
   - `DROP TABLE eggs_collection_new CASCADE;`
   - `DROP TABLE breeding_sites_new CASCADE;`
   - `DROP TABLE adult_mosquitoes_new CASCADE;`

### Phase 2 : Créer les nouvelles tables
1. ✅ Créer `houses`
2. ✅ Créer `eggs_collections`
3. ✅ Créer `breeding_sites`
4. ✅ Créer `adult_mosquitoes_collections`
5. ✅ Créer `mosquito_specimens`
6. ✅ Créer les vues (`breeding_sites_summary`, `adult_mosquitoes_summary`)
7. ✅ Créer les index

### Phase 3 : Adapter le backend
1. ✅ Modifier `api-collect.js` :
   - Route `/collect/eggs` : Logique "Find or Create" pour houses
   - Route `/collect/breeding` : Logique "Find or Create" + insertion multiple gîtes
   - Route `/collect/mosquitoes` : Logique "Find or Create" + insertion collecte + spécimens
2. ✅ Créer helper functions :
   - `findOrCreateHouse(concession_code, sector, environment, gps_coordinates)`
   - `updateHouseDetails(house_id, house_code, household_size, sleeping_unit_count, head_contact)`
3. ✅ Créer endpoints pour récupérer les vues calculées

### Phase 4 : Adapter le frontend (MINIMAL pour eggs)
1. ✅ `eggs_collections` : **AUCUN CHANGEMENT** - Le formulaire reste identique
2. 🔄 `breeding_sites` : **CHANGEMENT MAJEUR** - Interface répétitive pour saisir plusieurs gîtes
3. 🔄 `adult_mosquitoes` : **CHANGEMENT MAJEUR** - Interface en 2 étapes (collecte + spécimens)

### Phase 5 : Tests
1. ✅ Tester l'insertion d'œufs (vérifier création automatique de houses)
2. ✅ Tester l'insertion de gîtes
3. ✅ Tester l'insertion de moustiques adultes
4. ✅ Vérifier les vues calculées

### Phase 6 : Déploiement progressif
1. ✅ **Étape 1** : Déployer uniquement `houses` + `eggs_collections` (plus simple)
2. ✅ **Étape 2** : Déployer `breeding_sites` après validation de l'étape 1
3. ✅ **Étape 3** : Déployer `adult_mosquitoes_collections` + `mosquito_specimens`

---

## ❓ QUESTIONS POUR VALIDATION

### Pour `eggs_collections` :
1. **Confirmez** : 1 enregistrement = 1 visite dans 1 maison ?
2. Les champs `nest_number`, `nest_code`, `pass_order` sont-ils vraiment nécessaires ?
3. Ou faut-il créer une table `nests` séparée avec 1 ligne = 1 nid ?

### Pour `breeding_sites` :
1. **Confirmez** : 1 enregistrement = 1 gîte larvaire individuel ?
2. Un gîte ne peut contenir qu'UN SEUL genre de larves/nymphes ? Ou plusieurs ?
3. Si plusieurs genres possibles, faut-il créer une table `larvae_specimens` similaire à `mosquito_specimens` ?

### Pour `adult_mosquitoes_collections` :
1. **Confirmez** : 1 enregistrement de collecte = 1 méthode × 1 localisation ?
2. Les 4 collectes (prokopack/bg × interior/exterior) se font toujours le même jour ?
3. Faut-il permettre plusieurs collectes par jour dans la même maison ?

---

## 📝 PROCHAINES ÉTAPES

Dites-moi :
1. ✅ Cette architecture vous convient-elle ?
2. 🔧 Quels ajustements souhaitez-vous ?
3. 🚀 Par quelle table commencer la migration ?

