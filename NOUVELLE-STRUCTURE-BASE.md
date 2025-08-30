# 🚀 NOUVELLE STRUCTURE DE BASE DE DONNÉES - Centre MURAZ

## 📋 **Vue d'ensemble**

Cette nouvelle structure de base de données est optimisée pour :
- ✅ **Données de terrain** (gîtes, œufs, moustiques adultes)
- ✅ **Analyses laboratoires** (PCR, Bioessai, Repas sanguin)
- ✅ **Calculs d'indices entomologiques** automatiques
- ✅ **Génération de cartes** avec coordonnées GPS
- ✅ **Synchronisation KoboCollect** optimisée

---

## 🏗️ **STRUCTURE DES TABLES**

### **📊 PHASE 1 : DONNÉES DE TERRAIN**

#### **1. `household_visits` - Informations communes par maison**
- **Enquêteur** : nom, concession, maison
- **Visite** : dates, heures, secteur, environnement
- **GPS** : coordonnées au format "11.180729 -4.3616"
- **Caractéristiques** : taille, couchettes, contact

#### **2. `eggs_collection` - Données œufs**
- **Pondoir** : numéro, code, ordre de passage
- **Collecte** : nombre d'œufs, observations

#### **3. `breeding_sites` - Données gîtes larvaires**
- **Compteurs** : total, positifs, négatifs
- **Larves** : comptage par genre (Aedes, Culex, Anopheles)
- **Nymphes** : comptage par genre
- **Classification** : types et classes de gîtes

#### **4. `adult_mosquitoes` - Données moustiques adultes**
- **Classification** : genre, espèce
- **Collecte** : méthodes, pièges, lieux
- **Compteurs** : par piège, par sexe, états physiologiques

---

### **🧬 PHASE 2 : ANALYSES LABORATOIRES (Déjà existantes)**

#### **5. `infos_communes` - Informations communes aux analyses**
#### **6. `analyses_pcr` - Analyses PCR/RT-PCR**
#### **7. `analyses_bioessai` - Tests de résistance aux insecticides**
#### **8. `analyses_repas_sanguin` - Origine des repas sanguins**

---

### **📈 PHASE 3 : INDICES CALCULÉS**

#### **9. `entomological_indices` - Indices par mois**
- **Indice de Breteau** : (Gîtes positifs × 100) / Maisons visitées
- **Indice de Maison** : (Maisons avec gîtes positifs × 100) / Total maisons
- **Indice de Récipient** : (Gîtes positifs × 100) / Total gîtes
- **Indice de positivité pondoir** : (Pièges positifs × 100) / Total pièges
- **Indice de colonisation nymphale** : (Maisons infestées nymphes × 100) / Total maisons
- **Indice adultes par piège BG** : Moustiques / (Pièges BG × 100)
- **Indice adultes par piège Prokopack** : Moustiques / (Pièges Prokopack × 100)

---

## 🚀 **INSTALLATION ET UTILISATION**

### **1. Créer la nouvelle structure**
```bash
# Option 1 : Via npm script
npm run db:new

# Option 2 : Directement
node scripts/setup-new-database.js
```

### **2. Vérifier la création**
```bash
# Se connecter à PostgreSQL
psql -U votre_utilisateur -d centre_muraz

# Lister les tables
\dt

# Vérifier la structure d'une table
\d household_visits
```

---

## 🔧 **FONCTIONNALITÉS AVANCÉES**

### **📍 Génération de cartes**
```javascript
// Exemple d'extraction des coordonnées GPS
function parseGPSCode(gpsCode) {
    const parts = gpsCode.trim().split(' ');
    if (parts.length >= 2) {
        return {
            lat: parseFloat(parts[0]),
            lng: parseFloat(parts[1])
        };
    }
    return null;
}

// Utilisation avec Leaflet
const coords = parseGPSCode("11.180729 -4.3616");
L.marker([coords.lat, coords.lng]).addTo(map);
```

### **📊 Calculs d'indices automatiques**
```sql
-- Exemple de calcul de l'Indice de Breteau
SELECT 
    sector,
    (SUM(bs.positive_sites) * 100.0 / COUNT(DISTINCT hv.id)) as breteau_index
FROM household_visits hv
JOIN breeding_sites bs ON hv.id = bs.household_visit_id
WHERE hv.visit_start_date >= '2024-01-01'
GROUP BY sector;
```

---

## 🎯 **PROCHAINES ÉTAPES**

### **1. Synchronisation KoboCollect**
- Adapter le service de synchronisation
- Mapper les formulaires aux nouvelles tables
- Gérer les erreurs et validations

### **2. Calculs d'indices**
- Implémenter les formules de calcul
- Automatiser les calculs mensuels
- Créer des alertes pour les seuils critiques

### **3. Interface utilisateur**
- Page d'affichage des indices
- Graphiques et visualisations
- Export des données

### **4. Tests et validation**
- Données de test
- Validation des calculs
- Performance et optimisation

---

## 🔍 **VÉRIFICATION ET MAINTENANCE**

### **Vérifier l'intégrité des données**
```sql
-- Vérifier les contraintes
SELECT * FROM information_schema.check_constraints 
WHERE constraint_schema = 'public';

-- Vérifier les index
SELECT * FROM pg_indexes 
WHERE tablename IN ('household_visits', 'breeding_sites', 'adult_mosquitoes');
```

### **Maintenance des index**
```sql
-- Analyser les tables
ANALYZE household_visits;
ANALYZE breeding_sites;
ANALYZE adult_mosquitoes;
```

---

## 📞 **SUPPORT**

Pour toute question ou problème :
1. Vérifiez les logs de création
2. Consultez la structure des tables
3. Testez avec des données de test
4. Contactez l'équipe technique

---

**Centre MURAZ - Plateforme de Surveillance des Arboviroses**  
*Ministère de la Santé - Burkina Faso*




