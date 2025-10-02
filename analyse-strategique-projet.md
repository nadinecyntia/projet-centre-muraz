# 🔍 ANALYSE STRATÉGIQUE DU PROJET CENTRE MURAZ

## 📊 ANALYSE PAR CATÉGORIES

### 🟢 **FICHIERS CORE (CRITIQUES - NE PAS SUPPRIMER)**

#### **Configuration & Serveur**
- `server.js` - **CRITIQUE** - Point d'entrée principal
- `package.json` - **CRITIQUE** - Dépendances et scripts
- `config/database.js` - **CRITIQUE** - Configuration PostgreSQL
- `middleware/auth.js` - **CRITIQUE** - Authentification

#### **Routes API (Actives)**
- `routes/api-analyses.js` - **CRITIQUE** - APIs analyses principales
- `routes/api-indices.js` - **CRITIQUE** - APIs calculs indices
- `routes/api-biologie.js` - **CRITIQUE** - APIs biologie moléculaire
- `routes/api-archive.js` - **CRITIQUE** - APIs archivage
- `routes/api-users.js` - **CRITIQUE** - APIs utilisateurs

#### **Frontend Core**
- `public/index.html` - **CRITIQUE** - Page d'accueil
- `public/analyses.html` - **CRITIQUE** - Page analyses
- `public/indices.html` - **CRITIQUE** - Page indices
- `public/biologie-moleculaire.html` - **CRITIQUE** - Page biologie
- `public/login.html` - **CRITIQUE** - Page connexion
- `public/collect-v2.html` - **CRITIQUE** - Formulaires collecte

#### **JavaScript Frontend**
- `public/js/analyses.js` - **CRITIQUE** - Logique analyses
- `public/js/indices.js` - **CRITIQUE** - Logique indices
- `public/js/biologie-moleculaire.js` - **CRITIQUE** - Logique biologie
- `public/css/style.css` - **CRITIQUE** - Styles principaux

#### **Scripts de Données**
- `seed-smart.js` - **IMPORTANT** - Population données test

---

### 🟡 **FICHIERS UTILES (À CONSERVER)**

#### **Documentation**
- `README.md` - **UTILE** - Documentation projet
- `description-graphiques.md` - **UTILE** - Documentation graphiques
- `ARCHIVE_SYSTEM_SUMMARY.md` - **UTILE** - Documentation archivage

#### **Scripts SQL**
- `scripts/create-new-archive-system.sql` - **UTILE** - Création tables archives
- `scripts/archive-yearly.js` - **UTILE** - Script archivage
- `scripts/cleanup-old-archive-system.sql` - **UTILE** - Nettoyage ancien système

#### **Configuration Avancée**
- `tailwind.config.js` - **UTILE** - Configuration Tailwind CSS
- `config/kobo-config.js` - **UTILE** - Configuration KoBoCollect (si utilisé)
- `config/kobocollect-forms.js` - **UTILE** - Formulaires KoBoCollect

---

### 🔴 **FICHIERS SUSPECTS (À ANALYSER)**

#### **Routes Potentiellement Obsolètes**
- `routes/api-analyses-archive.js` - **SUSPECT** - Doublon avec api-analyses.js ?
- `routes/api-indices-archive.js` - **SUSPECT** - Doublon avec api-indices.js ?
- `routes/api-collect.js` - **SUSPECT** - Utilisé ou obsolète ?
- `routes/api-csv.js` - **SUSPECT** - Fonctionnalité CSV utilisée ?
- `routes/api-validation.js` - **SUSPECT** - Système de validation actif ?
- `routes/api.js` - **SUSPECT** - Routes générales ou obsolètes ?

#### **Contrôleurs & Services**
- `controllers/authController.js` - **SUSPECT** - Utilisé ou middleware/auth.js suffit ?
- `services/kobocollect-sync.js` - **SUSPECT** - Synchronisation KoBoCollect active ?

#### **Pages HTML Suspectes**
- `public/admin.html` - **SUSPECT** - Page admin utilisée ?
- `public/admin-users.html` - **SUSPECT** - Gestion utilisateurs via interface ?
- `public/admin-validation.html` - **SUSPECT** - Validation via interface ?
- `public/admin-validation-backup.html` - **SUSPECT** - Backup ou obsolète ?
- `public/debug-biologie.html` - **SUSPECT** - Page debug temporaire ?

#### **JavaScript Suspects**
- `public/js/admin.js` - **SUSPECT** - Logique admin utilisée ?
- `public/js/app.js` - **SUSPECT** - Logique générale ou obsolète ?

#### **Fichiers de Test**
- `test-biologie-api.js` - **SUSPECT** - Test temporaire ?
- `test-carousel-images.html` - **SUSPECT** - Test temporaire ?
- `test-filters.html` - **SUSPECT** - Test temporaire ?
- `test-view-button.html` - **SUSPECT** - Test temporaire ?
- `public/test-api-frontend.html` - **SUSPECT** - Test temporaire ?
- `public/test-carousel-images.html` - **SUSPECT** - Test temporaire ?

#### **Images & Assets**
- `1.jpg`, `2.jpeg`, `3.jpg` - **SUSPECT** - Images utilisées ?
- `public/1.jpg`, `public/2.jpeg`, `public/3.jpg` - **SUSPECT** - Images utilisées ?
- `public/logo-centre-muraz.jpg` - **UTILE** - Logo probablement utilisé

#### **Scripts SQL Suspects**
- `scripts/fix-archive-analyses-tables.sql` - **SUSPECT** - Fix temporaire ?
- `scripts/fix-archive-infos-communes-table.sql` - **SUSPECT** - Fix temporaire ?
- `scripts/recreate-tables-modified-forms.sql` - **SUSPECT** - Migration temporaire ?
- `scripts/create-database-indexes.sql` - **SUSPECT** - Index créés ou à créer ?

#### **Autres**
- `seed-sample-data.js` - **SUSPECT** - Doublon avec seed-smart.js ?
- `public/css/input.css` - **SUSPECT** - CSS Tailwind ou personnalisé ?
- `public/js/charts/` - **SUSPECT** - Dossier vide ou contenu ?

---

## 🎯 **STRATÉGIE DE NETTOYAGE RECOMMANDÉE**

### **Phase 1 : Analyse Détaillée**
1. Vérifier les imports et références dans le code
2. Tester les fonctionnalités suspectes
3. Identifier les dépendances cachées

### **Phase 2 : Suppression Progressive**
1. **D'abord** : Fichiers de test évidents
2. **Ensuite** : Routes non référencées
3. **Enfin** : Pages HTML non liées

### **Phase 3 : Validation**
1. Tests fonctionnels après chaque suppression
2. Vérification des imports cassés
3. Test de toutes les pages principales

---

## ⚠️ **RISQUES IDENTIFIÉS**

### **Risques Élevés**
- Supprimer des routes API utilisées par le frontend
- Supprimer des pages HTML référencées dans la navigation
- Supprimer des scripts SQL nécessaires au fonctionnement

### **Risques Moyens**
- Supprimer des fonctionnalités admin utilisées occasionnellement
- Supprimer des scripts de migration encore nécessaires

### **Risques Faibles**
- Supprimer des fichiers de test temporaires
- Supprimer des images non utilisées

---

## 📋 **PLAN D'ACTION PROPOSÉ**

1. **Analyser les imports** dans server.js et les fichiers HTML
2. **Tester chaque route API** pour vérifier l'utilisation
3. **Vérifier les liens** dans les pages HTML
4. **Supprimer progressivement** en commençant par les tests
5. **Valider après chaque étape** que le projet fonctionne

**Voulez-vous que je commence par analyser les imports et références pour identifier précisément quels fichiers peuvent être supprimés en toute sécurité ?**
