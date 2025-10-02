# 📊 DESCRIPTION DU FONCTIONNEMENT DES GRAPHIQUES - PLATEFORME CENTRE MURAZ

## 🎯 Vue d'ensemble
La plateforme Centre MURAZ utilise **Chart.js** pour visualiser les données entomologiques collectées dans trois tables principales :
- `eggs_collection_new` : Données des œufs de moustiques
- `breeding_sites_new` : Données des gîtes larvaires  
- `adult_mosquitoes_new` : Données des moustiques adultes

---

## 📈 SECTION ŒUFS

### 1️⃣ **Graphique : Nombre d'œufs par secteur**
**Type :** Graphique en barres  
**Données source :** Table `eggs_collection_new`  
**Colonnes utilisées :**
- `eggs_sector` : Secteur géographique (Sector 6, 9, 22, 26, 33)
- `eggs_count` : Nombre d'œufs collectés

**Fonctionnement :**
- Groupe les données par secteur
- Somme le nombre total d'œufs par secteur
- Affiche une barre par secteur avec la valeur totale
- Échelle adaptative selon le volume de données

---

### 2️⃣ **Graphique : Nombre d'œufs par mois et par secteur**
**Type :** Graphique en barres groupées  
**Données source :** Table `eggs_collection_new`  
**Colonnes utilisées :**
- `eggs_visit_start_date` : Date de visite (extraction du mois)
- `eggs_sector` : Secteur géographique
- `eggs_count` : Nombre d'œufs

**Fonctionnement :**
- Groupe par secteur ET par mois
- Crée une série de données par secteur
- Axe X : Mois (Janvier, Février, Mars...)
- Axe Y : Nombre d'œufs
- Couleurs différentes pour chaque secteur
- Tri chronologique des mois

---

### 3️⃣ **Graphique : Nombre d'œufs par mois et par milieu**
**Type :** Graphique en barres groupées  
**Données source :** Table `eggs_collection_new`  
**Colonnes utilisées :**
- `eggs_visit_start_date` : Date de visite (extraction du mois)
- `eggs_environment` : Milieu (urban/rural)
- `eggs_count` : Nombre d'œufs

**Fonctionnement :**
- Groupe par milieu ET par mois
- Crée une série de données par milieu
- Axe X : Mois (Janvier, Février, Mars...)
- Axe Y : Nombre d'œufs
- Couleurs différentes pour urbain/rural
- Filtre par milieu disponible (dropdown)

---

## 🌱 SECTION LARVES

### 4️⃣ **Graphique : Nombre de larves et nymphes par secteur et par mois**
**Type :** Graphique en barres groupées  
**Données source :** Table `breeding_sites_new`  
**Colonnes utilisées :**
- `site_visit_start_date` : Date de visite (extraction du mois)
- `site_sector` : Secteur géographique
- `larvae_count` : Nombre de larves
- `nymphs_count` : Nombre de nymphes

**Fonctionnement :**
- Groupe par secteur ET par mois
- **Somme** `larvae_count + nymphs_count` pour chaque enregistrement
- Crée une série de données par secteur
- Axe X : Mois individuels (pas par période de 2 mois)
- Axe Y : Total larves + nymphes
- Couleurs différentes pour chaque secteur
- Gestion des valeurs NULL (ignorées)

---

### 5️⃣ **Graphique : Nombre de gîtes par secteur par mois**
**Type :** Graphique en barres groupées  
**Données source :** Table `breeding_sites_new`  
**Colonnes utilisées :**
- `site_visit_start_date` : Date de visite (extraction du mois)
- `site_sector` : Secteur géographique
- `total_sites_count` : Nombre total de gîtes inspectés

**Fonctionnement :**
- Groupe par secteur ET par mois
- Somme le nombre total de gîtes par secteur/mois
- Crée une série de données par secteur
- Axe X : Mois (Janvier, Février, Mars...)
- Axe Y : Nombre de gîtes
- Couleurs différentes pour chaque secteur
- Échelle adaptative avec formatage (K, M)

---

## 🔬 SECTION RECHERCHE

### 6️⃣ **Graphique : Nombre d'Aedes par secteur et par mois**
**Type :** Graphique en barres groupées  
**Données source :** Table `adult_mosquitoes_new`  
**Colonnes utilisées :**
- `mosquitoes_visit_start_date` : Date de visite (extraction du mois)
- `mosquitoes_sector` : Secteur géographique
- `mosquitoes_aedes_count` : Nombre de moustiques Aedes

**Fonctionnement :**
- Groupe par secteur ET par mois
- Somme le nombre d'Aedes par secteur/mois
- Crée une série de données par secteur
- Axe X : Mois (Janvier, Février, Mars...)
- Axe Y : Nombre d'Aedes
- Couleurs différentes pour chaque secteur
- Gestion des valeurs NULL (ignorées)

---

### 7️⃣ **Graphique : Quantité par classe de gîtes selon le milieu**
**Type :** Graphique en barres groupées  
**Données source :** Table `breeding_sites_new`  
**Colonnes utilisées :**
- `site_classes` : Classes de gîtes (ARRAY) - household waste, abandoned utensils, car wrecks, etc.
- `site_environment` : Milieu (urban/rural)
- `total_sites_count` : Nombre total de gîtes

**Fonctionnement :**
- Parse le champ `site_classes` (array JSON)
- Groupe par classe de gîte ET par milieu
- Somme le nombre de gîtes par classe/milieu
- Crée une série de données par classe de gîte
- Axe X : Milieu (urban/rural)
- Axe Y : Nombre de gîtes
- Couleurs différentes pour chaque classe
- Labels réels des classes (pas "classe A", "classe B")

---

### 8️⃣ **Graphique : Nombre d'Aedes par méthode de collecte et lieu de capture**
**Type :** Graphique en barres groupées  
**Données source :** Table `adult_mosquitoes_new`  
**Colonnes utilisées :**
- `collection_methods` : Méthode de collecte (prokopack, bg_trap, other)
- `capture_locations` : Lieu de capture (interior, exterior)
- `mosquitoes_aedes_count` : Nombre de moustiques Aedes

**Fonctionnement :**
- Groupe par méthode de collecte ET par lieu de capture
- Somme le nombre d'Aedes par méthode/lieu
- Crée une série de données par méthode de collecte
- Axe X : Lieu de capture (interior/exterior)
- Axe Y : Nombre d'Aedes
- Couleurs différentes pour chaque méthode
- Gestion des valeurs NULL (ignorées)

---

## 🔧 CARACTÉRISTIQUES TECHNIQUES COMMUNES

### **Échelle Adaptative**
- Calcul automatique de la valeur maximale
- Formatage intelligent (K pour milliers, M pour millions)
- Configuration dynamique de l'axe Y

### **Gestion des Données**
- Filtrage des valeurs NULL/undefined
- Tri chronologique des mois
- Support des données archivées (sélecteur d'année)

### **Interactivité**
- Tooltips informatifs au survol
- Légende cliquable pour masquer/afficher les séries
- Responsive design (adaptation mobile)

### **Sources de Données**
- **APIs REST** : `/api/analyses/eggs`, `/api/analyses/breeding`, `/api/analyses/mosquitoes`
- **Support multi-années** : Données actuelles + archives
- **Filtrage** : Par statut 'approved' uniquement

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### **Données Manquantes**
- `larvae_count` et `nymphs_count` souvent NULL dans `breeding_sites_new`
- `collection_methods`, `capture_locations`, `mosquitoes_aedes_count` souvent NULL dans `adult_mosquitoes_new`
- `site_classes` souvent vide (array vide)

### **Impact**
- Graphiques vides ou avec peu de données
- Visualisations "fades" sans variation
- Fonctionnalités de recherche limitées

### **Solution Recommandée**
Enrichir les données de test avec des valeurs réalistes pour toutes les colonnes critiques.
