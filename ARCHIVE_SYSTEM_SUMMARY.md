# 📚 SYSTÈME D'ARCHIVAGE COMPLET - CENTRE MURAZ

## 🎯 Vue d'ensemble

Le système d'archivage du Centre MURAZ permet de gérer automatiquement la conservation et l'accès aux données historiques de surveillance des arboviroses. Il archive automatiquement les données d'une année complète vers des tables dédiées, permettant de maintenir les performances de la base de données tout en préservant l'accès aux données historiques.

## 🏗️ Architecture du système

### 1. **Tables d'archive créées**
- `eggs_collection_archive` - Archive des données d'œufs
- `breeding_sites_archive` - Archive des données de gîtes larvaires  
- `adult_mosquitoes_archive` - Archive des données de moustiques adultes
- `analyses_pcr_archive` - Archive des analyses PCR
- `analyses_bioessai_archive` - Archive des analyses bioessai
- `analyses_repas_sanguin_archive` - Archive des analyses de repas sanguin
- `infos_communes_archive` - Archive des informations communales
- `archive_runs` - Métadonnées des opérations d'archivage

### 2. **API d'archivage** (`/api/archive/`)
- `GET /api/archive/runs` - Lister les opérations d'archivage
- `GET /api/archive/runs/:runId` - Détails d'une opération
- `POST /api/archive/year/:year` - Archiver une année spécifique
- `DELETE /api/archive/cleanup/:year` - Supprimer les données originales après archivage
- `GET /api/archive/statistics` - Statistiques des archives
- `GET /api/archive/years` - Années disponibles dans les archives

### 3. **Script d'archivage automatique** (`scripts/archive-yearly.js`)
- Archivage automatique des données d'une année
- Support des paramètres `--force` et `--cleanup`
- Génération de rapports JSON
- Gestion des erreurs et transactions atomiques

## 🔧 Fonctionnalités

### **Archivage automatique**
- ✅ Archivage de toutes les données validées (`status = 'approved'`)
- ✅ Conservation des métadonnées (dates, utilisateurs, lots)
- ✅ Traçabilité complète avec `archive_run_id`
- ✅ Transactions atomiques (tout ou rien)

### **APIs avec support d'archivage**
- ✅ Paramètre `?year=YYYY` pour consulter les archives
- ✅ Mode automatique : données actuelles ou archives selon l'année
- ✅ Compatibilité totale avec les interfaces existantes

### **Gestion des données**
- ✅ Seules les données approuvées sont archivées
- ✅ Les données originales sont conservées par défaut
- ✅ Option `--cleanup` pour supprimer les données originales
- ✅ Vérification des doublons d'archivage

## 📊 Utilisation

### **Archivage manuel via API**
```bash
# Archiver l'année 2023
curl -X POST http://localhost:3000/api/archive/year/2023 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Consulter les archives de 2023
curl "http://localhost:3000/api/analyses?year=2023"
curl "http://localhost:3000/api/indices?year=2023"
```

### **Archivage automatique via script**
```bash
# Archiver l'année précédente
node scripts/archive-yearly.js

# Archiver une année spécifique
node scripts/archive-yearly.js 2023

# Archiver et supprimer les données originales
node scripts/archive-yearly.js 2023 --cleanup

# Forcer le réarchivage
node scripts/archive-yearly.js 2023 --force
```

### **Configuration cron (recommandée)**
```bash
# À exécuter le 1er janvier de chaque année
0 0 1 1 * /usr/bin/node /path/to/archive-yearly.js --cleanup
```

## 🔒 Sécurité et intégrité

### **Contrôles d'accès**
- ✅ Authentification requise pour toutes les opérations d'archivage
- ✅ Seuls les SUPER_ADMIN peuvent archiver/supprimer
- ✅ Logs détaillés de toutes les opérations

### **Intégrité des données**
- ✅ Transactions atomiques avec rollback automatique
- ✅ Vérification des contraintes de base de données
- ✅ Validation des types de données
- ✅ Rapports détaillés des opérations

## 📈 Performance et optimisation

### **Index optimisés**
- ✅ Index par année d'archivage (`archived_year`)
- ✅ Index par date de collecte (`created_at`, `visit_start_date`)
- ✅ Index par secteur pour les requêtes géographiques

### **Requêtes optimisées**
- ✅ Requêtes avec filtres par année
- ✅ Support des partitions par année (optionnel)
- ✅ Agrégations optimisées pour les indices

## 🚀 Déploiement et maintenance

### **Fichiers créés/modifiés**
- `scripts/create-new-archive-system.sql` - Création des tables d'archive
- `scripts/cleanup-old-archive-system.sql` - Nettoyage de l'ancien système
- `scripts/archive-yearly.js` - Script d'archivage automatique
- `routes/api-archive.js` - API d'archivage
- `routes/api-analyses-archive.js` - API analyses avec support d'archivage
- `routes/api-indices-archive.js` - API indices avec support d'archivage
- `server.js` - Intégration des routes d'archivage

### **Maintenance**
- ✅ Rapports automatiques dans `scripts/archive-reports/`
- ✅ Monitoring des opérations via `archive_runs`
- ✅ Nettoyage des rapports anciens (recommandé)

## 📋 Exemple d'utilisation complète

```bash
# 1. Archiver l'année 2023
node scripts/archive-yearly.js 2023 --cleanup

# 2. Vérifier l'archivage
curl "http://localhost:3000/api/archive/runs"

# 3. Consulter les données archivées
curl "http://localhost:3000/api/analyses?year=2023"
curl "http://localhost:3000/api/indices?year=2023"

# 4. Obtenir les statistiques
curl "http://localhost:3000/api/archive/statistics"
```

## 🎉 Résultat

Le système d'archivage est maintenant **entièrement fonctionnel** et permet :

1. **Archivage automatique** des données annuelles
2. **Conservation** de l'accès aux données historiques
3. **Optimisation** des performances de la base de données
4. **Traçabilité** complète des opérations
5. **Sécurité** et intégrité des données
6. **Compatibilité** totale avec les interfaces existantes

Le système est prêt pour la production et peut être déployé immédiatement ! 🚀
