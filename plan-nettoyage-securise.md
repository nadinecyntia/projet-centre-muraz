# 🧹 PLAN DE NETTOYAGE STRATÉGIQUE - CENTRE MURAZ

## 📊 ANALYSE DES DÉPENDANCES

### ✅ **FICHIERS UTILISÉS (À CONSERVER)**

#### **Routes API Actives**
- `routes/api-analyses.js` ✅ Utilisé ligne 72
- `routes/api-indices.js` ✅ Utilisé ligne 73  
- `routes/api-users.js` ✅ Utilisé ligne 74
- `routes/api-biologie.js` ✅ Utilisé ligne 70
- `routes/api-archive.js` ✅ Utilisé ligne 68
- `routes/api-validation.js` ✅ Utilisé ligne 69
- `routes/api-collect.js` ✅ Utilisé ligne 75
- `routes/api-csv.js` ✅ Utilisé ligne 71
- `routes/api.js` ✅ Utilisé ligne 76 (routes générales)

#### **Pages HTML Actives**
- `public/index.html` ✅ Route `/` ligne 146
- `public/login.html` ✅ Route `/login` ligne 138
- `public/analyses.html` ✅ Route `/analyses` ligne 161
- `public/indices.html` ✅ Route `/indices` ligne 203
- `public/biologie-moleculaire.html` ✅ Route `/biologie-moleculaire` ligne 156
- `public/admin.html` ✅ Route `/admin` ligne 171
- `public/admin-users.html` ✅ Route `/admin/users` ligne 181
- `public/admin-validation.html` ✅ Route `/admin-validation` ligne 196
- `public/collect-v2.html` ✅ Route `/collect` ligne 176

#### **JavaScript Actifs**
- `public/js/app.js` ✅ Référencé dans toutes les pages HTML
- `public/js/analyses.js` ✅ Référencé dans analyses.html
- `public/js/indices.js` ✅ Référencé dans indices.html
- `public/js/biologie-moleculaire.js` ✅ Référencé dans biologie-moleculaire.html
- `public/js/admin.js` ✅ Référencé dans admin.html

#### **Images Utilisées**
- `public/logo-centre-muraz.jpg` ✅ Référencé dans toutes les pages principales
- `public/1.jpg` ✅ Référencé dans index.html et test-carousel-images.html
- `public/2.jpeg` ✅ Référencé dans index.html et test-carousel-images.html
- `public/3.jpg` ✅ Référencé dans index.html et test-carousel-images.html

---

## 🗑️ **FICHIERS À SUPPRIMER EN TOUTE SÉCURITÉ**

### **🔴 FICHIERS DE TEST (SUPPRESSION IMMÉDIATE)**

#### **Pages HTML de Test**
- `public/test-carousel-images.html` ❌ Test temporaire
- `public/test-api-frontend.html` ❌ Test temporaire
- `public/debug-biologie.html` ❌ Debug temporaire
- `test-carousel-images.html` ❌ Doublon racine
- `test-filters.html` ❌ Test temporaire
- `test-view-button.html` ❌ Test temporaire

#### **Scripts de Test**
- `test-biologie-api.js` ❌ Test temporaire

#### **Routes de Test (dans server.js)**
- Route `/test` ligne 215 ❌ Test temporaire
- Route `/index-simple` ligne 220 ❌ Test temporaire
- Route `/test-nav` ligne 225 ❌ Test temporaire
- Route `/index-no-css` ligne 230 ❌ Test temporaire
- Route `/test-echelle` ligne 235 ❌ Test temporaire
- Route `/test-echelle-simple` ligne 240 ❌ Test temporaire

### **🟡 FICHIERS SUSPECTS (À VÉRIFIER AVANT SUPPRESSION)**

#### **Routes API Potentiellement Obsolètes**
- `routes/api-analyses-archive.js` ⚠️ **À VÉRIFIER** - Possible doublon
- `routes/api-indices-archive.js` ⚠️ **À VÉRIFIER** - Possible doublon

#### **Pages HTML Suspectes**
- `public/admin-validation-backup.html` ⚠️ **À VÉRIFIER** - Backup ou obsolète ?

#### **Contrôleurs & Services**
- `controllers/authController.js` ⚠️ **À VÉRIFIER** - Utilisé ligne 18 server.js
- `services/kobocollect-sync.js` ⚠️ **À VÉRIFIER** - Synchronisation active ?

#### **Scripts SQL**
- `scripts/fix-archive-analyses-tables.sql` ⚠️ **À VÉRIFIER** - Fix temporaire ?
- `scripts/fix-archive-infos-communes-table.sql` ⚠️ **À VÉRIFIER** - Fix temporaire ?
- `scripts/recreate-tables-modified-forms.sql` ⚠️ **À VÉRIFIER** - Migration temporaire ?
- `scripts/create-database-indexes.sql` ⚠️ **À VÉRIFIER** - Index créés ?

#### **Autres**
- `seed-sample-data.js` ⚠️ **À VÉRIFIER** - Doublon avec seed-smart.js ?
- `public/css/input.css` ⚠️ **À VÉRIFIER** - CSS Tailwind ou personnalisé ?
- `public/js/charts/` ⚠️ **À VÉRIFIER** - Dossier vide ou contenu ?

---

## 🎯 **PLAN D'EXÉCUTION RECOMMANDÉ**

### **Phase 1 : Suppression Immédiate (Sans Risque)**
```bash
# Fichiers de test
rm public/test-carousel-images.html
rm public/test-api-frontend.html  
rm public/debug-biologie.html
rm test-carousel-images.html
rm test-filters.html
rm test-view-button.html
rm test-biologie-api.js

# Images non utilisées (si confirmées)
rm 1.jpg 2.jpeg 3.jpg  # Images racine (doublons)
```

### **Phase 2 : Nettoyage des Routes de Test**
Supprimer dans `server.js` :
- Ligne 215 : `app.get('/test', ...)`
- Ligne 220 : `app.get('/index-simple', ...)`
- Ligne 225 : `app.get('/test-nav', ...)`
- Ligne 230 : `app.get('/index-no-css', ...)`
- Ligne 235 : `app.get('/test-echelle', ...)`
- Ligne 240 : `app.get('/test-echelle-simple', ...)`

### **Phase 3 : Vérification des Suspects**
1. **Vérifier** `routes/api-analyses-archive.js` et `routes/api-indices-archive.js`
2. **Tester** si `controllers/authController.js` est nécessaire
3. **Analyser** `services/kobocollect-sync.js` pour usage
4. **Vérifier** les scripts SQL pour obsolescence

### **Phase 4 : Validation**
1. **Tester** toutes les pages principales
2. **Vérifier** toutes les fonctionnalités
3. **Contrôler** les imports cassés

---

## ⚠️ **PRÉCAUTIONS**

### **Avant Suppression**
1. **Sauvegarder** le projet complet
2. **Tester** chaque suppression individuellement
3. **Vérifier** les imports après chaque suppression

### **Après Suppression**
1. **Redémarrer** le serveur
2. **Tester** toutes les pages
3. **Vérifier** les fonctionnalités critiques

---

## 📋 **RÉSULTAT ATTENDU**

### **Fichiers Supprimés**
- **~7 fichiers de test** HTML/JS
- **~6 routes de test** dans server.js
- **~3 images doublons** (si confirmées)

### **Espace Libéré**
- **~50-100 KB** de fichiers inutiles
- **Code plus propre** et maintenable
- **Moins de confusion** pour les développeurs

### **Risque**
- **Très faible** - Seulement des fichiers de test
- **Aucun impact** sur les fonctionnalités principales

**Voulez-vous que je procède à la Phase 1 (suppression des fichiers de test) en toute sécurité ?**
