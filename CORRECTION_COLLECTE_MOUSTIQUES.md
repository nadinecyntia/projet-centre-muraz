# ✅ CORRECTION : COLLECTE DES MOUSTIQUES ADULTES

Date : 23 octobre 2025

---

## 🎯 PROBLÈME IDENTIFIÉ

### ❌ **Ancienne Approche (INCORRECTE)**

Le script de génération de données créait **1 seule ligne** avec des **strings multiples** :
```javascript
// ❌ INCORRECT
'prokopack,bg_trap', 'interior,exterior'
```

Cela signifiait qu'une ligne contenait plusieurs méthodes et plusieurs lieux sous forme de chaînes avec virgules.

---

## ✅ SOLUTION IMPLÉMENTÉE

### **Règle Correcte : 1 ligne = 1 combinaison (méthode × location)**

Pour les moustiques adultes, **chaque enregistrement** doit avoir :
- ✅ **UNE SEULE méthode** de collection : `prokopack` **OU** `bg_trap`
- ✅ **UN SEUL lieu** de capture : `interior` **OU** `exterior`

### **Exemple : Collecte Complète dans 1 Maison = 4 Lignes**

| Ligne | Méthode | Location | Description |
|-------|---------|----------|-------------|
| 1 | `prokopack` | `interior` | Prokopack à l'intérieur |
| 2 | `prokopack` | `exterior` | Prokopack à l'extérieur |
| 3 | `bg_trap` | `interior` | BG Trap à l'intérieur |
| 4 | `bg_trap` | `exterior` | BG Trap à l'extérieur |

---

## 📝 MODIFICATIONS APPORTÉES

### 1. ✅ **Script de Génération de Données : `scripts/seed-fake-data.js`**

#### **Avant (❌ Incorrect)**
```javascript
await client.query(
    `INSERT INTO adult_mosquitoes_collections (...) VALUES (...)`,
    [
        house.id, visitDate, '08:00:00', '12:00:00', investigator,
        'prokopack,bg_trap', 'interior,exterior',  // ❌ Strings multiples
        ...
    ]
);
```

#### **Après (✅ Correct)**
```javascript
// Définir les 4 combinaisons possibles
const combinations = [
    { method: 'prokopack', location: 'interior' },
    { method: 'prokopack', location: 'exterior' },
    { method: 'bg_trap', location: 'interior' },
    { method: 'bg_trap', location: 'exterior' }
];

// Créer une ligne pour chaque combinaison
for (const combo of selectedCombinations) {
    await client.query(
        `INSERT INTO adult_mosquitoes_collections (...) VALUES (...)`,
        [
            house.id, visitDate, '08:00:00', '12:00:00', investigator,
            combo.method,    // ✅ UNE méthode
            combo.location,  // ✅ UN lieu
            ...
        ]
    );
}
```

#### **Résultat**
- ✅ 70% des maisons ont une **collecte complète** (4 lignes)
- ✅ 30% des maisons ont une **collecte partielle** (1-3 lignes aléatoires)
- ✅ Chaque ligne a des comptages **spécifiques** à la combinaison méthode × location

---

### 2. ✅ **API d'Analyses : `public/js/analyses.js`**

#### **Avant (❌ Complexe et inutile)**
```javascript
// Gérer les strings avec virgules (ex: "prokopack,bg_trap")
let methodsList = [];
let locationsList = [];

if (typeof item.collection_methods === 'string') {
    methodsList = item.collection_methods.split(',').map(m => m.trim());
} else if (Array.isArray(item.collection_methods)) {
    methodsList = item.collection_methods;
}

// ... logique de split et division des comptages
methodsList.forEach(method => {
    locationsList.forEach(location => {
        // Diviser le compte équitablement
        const splitCount = parseInt(item.mosquitoes_aedes_count) / (methodsList.length * locationsList.length);
        groupedData[key].count += splitCount || 0;
    });
});
```

#### **Après (✅ Simple et correct)**
```javascript
// ✅ Maintenant chaque ligne a UNE SEULE méthode et UN SEUL lieu
const method = item.collection_methods;
const location = item.capture_locations;

methods.add(method);
locations.add(location);

const key = `${method}_${location}`;
if (!groupedData[key]) {
    groupedData[key] = { method: method, location: location, count: 0 };
}
groupedData[key].count += parseInt(item.mosquitoes_aedes_count) || 0;
```

#### **Résultat**
- ✅ **Code simplifié** (suppression de la logique de split)
- ✅ **Comptages corrects** (pas de division artificielle)
- ✅ **Performance améliorée** (moins d'itérations)

---

### 3. ✅ **Formulaire : `public/collect-v2.html`**

Le formulaire était **déjà correct** (sélection unique, pas de `multiple`) :

```html
<!-- ✅ Sélection unique pour la méthode -->
<select class="select" name="collection_methods">
    <option value="">--</option>
    <option value="prokopack">prokopack</option>
    <option value="bg_trap">bg_trap</option>
    <option value="other">other</option>
</select>

<!-- ✅ Sélection unique pour le lieu -->
<select class="select" name="capture_locations">
    <option value="">--</option>
    <option value="interior">interior</option>
    <option value="exterior">exterior</option>
</select>
```

**Aucune modification nécessaire** pour le formulaire HTML.

---

## 📊 IMPACT SUR LES CALCULS D'INDICES

### **Indice Adultes par Piège (IAP)**

#### **Formule**
```
IAP = Nombre total d'adultes capturés ÷ Nombre total de pièges installés
```

#### **Avant (avec strings multiples)**
- ❌ Une ligne contenait plusieurs méthodes/lieux
- ❌ Difficile de savoir combien de pièges étaient réellement installés
- ❌ Comptages approximatifs

#### **Après (avec lignes distinctes)**
- ✅ Chaque ligne = 1 méthode, 1 lieu, 1 ou plusieurs pièges
- ✅ `prokopack_traps_count` et `bg_traps_count` sont **spécifiques** à la ligne
- ✅ Comptages **précis** et **corrects**

---

## 🔍 VÉRIFICATION DE LA COHÉRENCE

### **Requête SQL pour Vérifier**

```sql
-- Vérifier les combinaisons méthode × location
SELECT 
    collection_methods, 
    capture_locations, 
    COUNT(*) as count
FROM adult_mosquitoes_collections
WHERE status = 'approved'
GROUP BY collection_methods, capture_locations
ORDER BY collection_methods, capture_locations;
```

**Résultat attendu** :
```
 collection_methods | capture_locations | count
--------------------+-------------------+-------
 bg_trap            | exterior          | X
 bg_trap            | interior          | Y
 prokopack          | exterior          | Z
 prokopack          | interior          | W
```

Chaque ligne doit avoir **UNE SEULE valeur** (pas de virgules).

---

### **Requête pour Compter les Maisons**

```sql
-- Nombre de maisons avec collecte de moustiques
SELECT COUNT(DISTINCT house_id) 
FROM adult_mosquitoes_collections
WHERE status = 'approved';

-- Nombre total de lignes (enregistrements)
SELECT COUNT(*) 
FROM adult_mosquitoes_collections
WHERE status = 'approved';
```

Si le nombre de lignes ≈ 4 × nombre de maisons, cela indique que la plupart des collectes sont complètes ✅

---

## 🚀 INSTRUCTIONS POUR RÉGÉNÉRER LES DONNÉES

### **Étape 1 : Supprimer les anciennes données**
```bash
node -e "const {pool} = require('./config/database'); pool.query('DELETE FROM adult_mosquitoes_collections; DELETE FROM breeding_sites; DELETE FROM eggs_collections; DELETE FROM houses;').then(() => { console.log('✅ Données supprimées'); pool.end(); });"
```

### **Étape 2 : Régénérer avec le nouveau script**
```bash
node scripts/seed-fake-data.js
```

### **Étape 3 : Vérifier les données**
```bash
# Compter les lignes de moustiques
node -e "const {pool} = require('./config/database'); pool.query('SELECT collection_methods, capture_locations, COUNT(*) as count FROM adult_mosquitoes_collections GROUP BY 1,2 ORDER BY 1,2').then(r => { console.log(r.rows); pool.end(); });"
```

---

## 📈 AVANTAGES DE LA CORRECTION

| Avantage | Description |
|----------|-------------|
| **🎯 Précision** | Chaque ligne représente exactement 1 combinaison |
| **🔍 Clarté** | Plus besoin de parser des strings avec virgules |
| **📊 Analyses** | Graphiques plus précis (pas de divisions artificielles) |
| **🛠️ Maintenabilité** | Code simplifié dans l'API d'analyses |
| **✅ Cohérence** | Structure conforme aux règles métier |
| **🚀 Performance** | Moins d'itérations et de splits |

---

## 📌 FICHIERS MODIFIÉS

1. ✅ **`scripts/seed-fake-data.js`**
   - Lignes 196-307 : Fonction `createMosquitoesCollections` complètement réécrite
   - Création de **4 lignes** par maison pour collecte complète

2. ✅ **`public/js/analyses.js`**
   - Lignes 1560-1631 : Fonction `processAedesMethodLocationData` simplifiée
   - Suppression de la logique de split des strings

3. ✅ **`public/collect-v2.html`**
   - ✅ **Aucune modification nécessaire** (déjà correct)

---

## ✅ RÉSUMÉ

### **Structure de Données Correcte**

Pour chaque maison visitée, on crée **plusieurs lignes** dans `adult_mosquitoes_collections` :

| Champ | Valeur | Type |
|-------|--------|------|
| `house_id` | ID de la maison | INTEGER (FK) |
| `collection_methods` | `'prokopack'` ou `'bg_trap'` | VARCHAR (unique) |
| `capture_locations` | `'interior'` ou `'exterior'` | VARCHAR (unique) |
| `prokopack_traps_count` | Nb de pièges (si prokopack) | INTEGER |
| `bg_traps_count` | Nb de pièges (si bg_trap) | INTEGER |
| `total_mosquitoes_count` | Total pour cette ligne | INTEGER |

### **Workflow de Collecte**

1. Investigateur arrive dans une maison
2. Installe des pièges **Prokopack à l'intérieur** → **Ligne 1**
3. Installe des pièges **Prokopack à l'extérieur** → **Ligne 2**
4. Installe des pièges **BG Trap à l'intérieur** → **Ligne 3**
5. Installe des pièges **BG Trap à l'extérieur** → **Ligne 4**

**Résultat** : 4 enregistrements pour 1 maison ✅

---

**Statut** : ✅ **CORRECTION COMPLÈTE**

La structure des données et l'API d'analyses sont maintenant **cohérentes** avec la règle : 
**1 ligne = 1 combinaison (méthode × location)**

---

**Date** : 23 octobre 2025  
**Développeur** : Assistant IA (Claude Sonnet 4.5)  
**Prochaine étape** : Régénérer les données fictives et tester les graphiques

