# 🚀 GUIDE DE DÉPLOIEMENT - SYSTÈME NORMALISÉ
## Centre MURAZ - Plateforme de Surveillance Arboviroses

---

## ⚠️ AVERTISSEMENT

Ce déploiement va **SUPPRIMER** toutes les données existantes dans les anciennes tables :
- `eggs_collection_new`
- `breeding_sites_new`
- `adult_mosquitoes_new`

**Si vous avez besoin de ces données, faites une sauvegarde MAINTENANT !**

---

## 📋 PRÉREQUIS

✅ Assurez-vous d'avoir :
- [x] PostgreSQL en cours d'exécution
- [x] Accès à la base de données `centre_muraz_arbovirose`
- [x] Les identifiants de connexion (dans `config/database.js`)
- [x] Une sauvegarde de la base de données (si nécessaire)

---

## 🎯 ÉTAPES DE DÉPLOIEMENT

### ÉTAPE 1 : Sauvegarde (Optionnel mais recommandé)

```bash
# Créer une sauvegarde de la base de données
pg_dump -U postgres -d centre_muraz_arbovirose > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou sauvegarder uniquement les anciennes tables
pg_dump -U postgres -d centre_muraz_arbovirose -t eggs_collection_new -t breeding_sites_new -t adult_mosquitoes_new > backup_old_tables.sql
```

---

### ÉTAPE 2 : Déployer les nouvelles tables

#### Option A : Script automatique (RECOMMANDÉ)

```bash
# Se connecter à PostgreSQL et exécuter le script maître
psql -U postgres -d centre_muraz_arbovirose -f scripts/deploy-new-normalized-system.sql
```

#### Option B : Scripts manuels (étape par étape)

```bash
# 1. Supprimer les anciennes tables
psql -U postgres -d centre_muraz_arbovirose -f scripts/drop-old-tables.sql

# 2. Créer les nouvelles tables
psql -U postgres -d centre_muraz_arbovirose -f scripts/create-new-normalized-tables.sql

# 3. Créer les vues pour calculs automatiques
psql -U postgres -d centre_muraz_arbovirose -f scripts/create-summary-views.sql
```

---

### ÉTAPE 3 : Vérifier le déploiement

```bash
# Se connecter à PostgreSQL
psql -U postgres -d centre_muraz_arbovirose

# Vérifier que les tables existent
\dt

# Vous devriez voir :
# - houses
# - eggs_collections
# - breeding_sites
# - adult_mosquitoes_collections
# - mosquito_specimens

# Vérifier que les vues existent
\dv

# Vous devriez voir :
# - breeding_sites_summary
# - adult_mosquitoes_summary
# - eggs_collections_with_house_info
# - houses_complete_stats
```

---

### ÉTAPE 4 : Activer le nouveau backend

Modifier le fichier `server.js` pour utiliser les nouvelles routes :

```javascript
// AVANT
const apiCollectRoutes = require('./routes/api-collect');

// APRÈS
const apiCollectRoutes = require('./routes/api-collect-normalized');
```

Ou renommer les fichiers :

```bash
# Sauvegarder l'ancien fichier
mv routes/api-collect.js routes/api-collect-OLD.js

# Activer le nouveau fichier
mv routes/api-collect-normalized.js routes/api-collect.js
```

---

### ÉTAPE 5 : Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C si en cours d'exécution)

# Redémarrer le serveur
node server.js
```

Vous devriez voir dans les logs :
```
✅ Connexion à PostgreSQL établie
✅ Table users vérifiée/créée
👤 Utilisateur admin déjà présent
🚀 Serveur Centre MURAZ démarré sur le port 3000
```

---

### ÉTAPE 6 : Tester les nouvelles routes

#### Test 1 : Collecte d'œufs (avec Postman ou curl)

```bash
curl -X POST http://localhost:3000/api/collect/eggs \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "eggs_concession_code": "TEST-001",
    "eggs_sector": "Sector 6",
    "eggs_environment": "urban",
    "eggs_gps_code": "12.345678,-1.234567",
    "eggs_visit_start_date": "2025-10-21",
    "nest_number": "NEST-01",
    "nest_code": "N001",
    "pass_order": "1",
    "eggs_count": 50,
    "observations": "Test collecte œufs"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Collecte d'œufs enregistrée avec succès",
  "egg_collection_id": 1,
  "house_id": 1
}
```

#### Test 2 : Collecte de gîtes

```bash
curl -X POST http://localhost:3000/api/collect/breeding \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{
    "house_info": {
      "concession_code": "TEST-001",
      "sector": "Sector 6",
      "environment": "urban",
      "gps_coordinates": "12.345678,-1.234567",
      "house_code": "HOUSE-A",
      "household_size": 5,
      "sleeping_unit_count": 3,
      "head_contact": "Jean Dupont",
      "visit_date": "2025-10-21",
      "investigator_name": "Dr. Martin"
    },
    "sites": [
      {
        "site_number": 1,
        "site_type": "pneu",
        "site_class": "household_waste",
        "is_positive": true,
        "larvae_count": 20,
        "larvae_genus": "aedes",
        "nymphs_count": 5,
        "nymphs_genus": "aedes"
      },
      {
        "site_number": 2,
        "site_type": "bidon",
        "site_class": "abandoned_utensils",
        "is_positive": false
      }
    ]
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "2 gîte(s) larvaire(s) enregistré(s) avec succès",
  "house_id": 1,
  "site_ids": [1, 2]
}
```

#### Test 3 : Récupérer le résumé calculé automatiquement

```bash
curl http://localhost:3000/api/breeding/summary/1/2025-10-21
```

**Réponse attendue :**
```json
{
  "success": true,
  "summary": {
    "house_id": 1,
    "visit_date": "2025-10-21",
    "investigator_name": "Dr. Martin",
    "total_sites_count": 2,
    "positive_sites_count": 1,
    "negative_sites_count": 1,
    "aedes_larvae_count": 20,
    "culex_larvae_count": 0,
    "total_larvae_count": 20,
    "aedes_nymphs_count": 5,
    "total_nymphs_count": 5,
    ...
  }
}
```

---

## ✅ VÉRIFICATIONS POST-DÉPLOIEMENT

### 1. Vérifier que les tables contiennent des données

```sql
-- Se connecter à PostgreSQL
psql -U postgres -d centre_muraz_arbovirose

-- Vérifier les maisons
SELECT * FROM houses;

-- Vérifier les collectes d'œufs
SELECT * FROM eggs_collections;

-- Vérifier les gîtes
SELECT * FROM breeding_sites;

-- Vérifier les résumés calculés
SELECT * FROM breeding_sites_summary;
```

### 2. Vérifier que les calculs automatiques fonctionnent

```sql
-- Insérer manuellement quelques gîtes pour tester
INSERT INTO breeding_sites (house_id, visit_date, investigator_name, site_type, site_class, is_positive, larvae_count, larvae_genus)
VALUES 
  (1, '2025-10-22', 'Test', 'pneu', 'household_waste', true, 10, 'aedes'),
  (1, '2025-10-22', 'Test', 'bidon', 'abandoned_utensils', true, 15, 'culex'),
  (1, '2025-10-22', 'Test', 'bassin', 'breeding_utensils', false, 0, null);

-- Vérifier les totaux calculés automatiquement
SELECT 
  total_sites_count,
  positive_sites_count,
  negative_sites_count,
  aedes_larvae_count,
  culex_larvae_count,
  total_larvae_count
FROM breeding_sites_summary
WHERE house_id = 1 AND visit_date = '2025-10-22';

-- Devrait afficher :
-- total_sites_count: 3
-- positive_sites_count: 2
-- negative_sites_count: 1
-- aedes_larvae_count: 10
-- culex_larvae_count: 15
-- total_larvae_count: 25
```

---

## 🐛 DÉPANNAGE

### Problème : "relation 'houses' does not exist"

**Solution :**
```bash
# Les tables n'ont pas été créées correctement
# Re-exécuter le script de création
psql -U postgres -d centre_muraz_arbovirose -f scripts/create-new-normalized-tables.sql
```

### Problème : "Cannot insert into view 'breeding_sites_summary'"

**Solution :**
C'est normal ! Les vues sont en **lecture seule**. 
Insérez dans la table `breeding_sites`, le résumé sera calculé automatiquement.

### Problème : "Foreign key violation on house_id"

**Solution :**
La maison n'existe pas. Le backend devrait créer automatiquement la maison via `findOrCreateHouse`.
Vérifiez que vous utilisez bien `api-collect-normalized.js`.

---

## 📊 DIFFÉRENCES AVEC L'ANCIEN SYSTÈME

| Aspect | Ancien système | Nouveau système |
|--------|---------------|-----------------|
| **Maisons** | Redondance dans chaque table | Table centrale `houses` |
| **Gîtes** | 1 ligne = 1 maison + totaux manuels | 1 ligne = 1 gîte + vue pour totaux |
| **Moustiques** | 1 ligne = tout mélangé | 1 ligne = 1 collecte + spécimens |
| **Totaux** | Saisis manuellement (erreurs) | Calculés automatiquement (fiables) |
| **Frontend œufs** | Aucun changement | Aucun changement ✅ |
| **Frontend gîtes** | 1 formulaire avec totaux | Interface répétitive (TODO) |
| **Frontend moustiques** | 1 formulaire avec totaux | 2 étapes : collecte + spécimens (TODO) |

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Backend déployé** - Les nouvelles routes fonctionnent
2. ⏳ **Frontend pour œufs** - Aucun changement nécessaire !
3. ⏳ **Frontend pour gîtes** - À adapter (interface répétitive)
4. ⏳ **Frontend pour moustiques** - À adapter (2 étapes)

---

## 📞 SUPPORT

En cas de problème :
1. Vérifiez les logs du serveur Node.js
2. Vérifiez les logs PostgreSQL
3. Testez les routes avec Postman pour identifier le problème
4. Consultez `WORKFLOW_BACKEND_FRONTEND.md` pour les détails d'implémentation

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Sauvegarde de la base de données effectuée
- [ ] Anciennes tables supprimées
- [ ] Nouvelles tables créées (5 tables)
- [ ] Vues créées (4 vues)
- [ ] Backend activé (`api-collect-normalized.js`)
- [ ] Serveur redémarré
- [ ] Test : Collecte d'œufs réussie
- [ ] Test : Collecte de gîtes réussie
- [ ] Test : Résumé calculé automatiquement
- [ ] Vérification : Les totaux sont corrects

---

**Une fois toutes les cases cochées, le nouveau système normalisé est opérationnel ! 🎉**

