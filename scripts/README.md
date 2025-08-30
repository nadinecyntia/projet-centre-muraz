# Scripts de Génération de Données de Test - Centre MURAZ

## 📋 Description

Ces scripts permettent de générer des données de test complètes pour tester la plateforme de surveillance des arboviroses du Centre MURAZ.

## 🗂️ Fichiers

- **`generate_test_data.sql`** : Script SQL contenant toutes les données de test
- **`run_test_data.js`** : Script Node.js pour exécuter le script SQL
- **`README.md`** : Ce fichier d'explication

## 📊 Données Générées

### Période
- **Janvier à Décembre 2024** (12 mois complets)

### Tables Remplies
1. **`household_visits`** : 60 visites de ménages
2. **`breeding_sites`** : 60 enregistrements de gîtes larvaires
3. **`eggs_collection`** : 60 collections d'œufs
4. **`adult_mosquitoes`** : 60 captures de moustiques adultes

### Secteurs
- **Sector 6** : urban et rural
- **Sector 9** : urban et rural  
- **Sector 26** : urban et rural
- **Sector 33** : urban et rural

### Types de Moustiques
- **Aedes aegypti** (majoritaire)
- **Culex** (various species)
- **Anopheles** (minoritaire)

### Structure des Données
- **Arrays PostgreSQL** pour les genres, espèces, méthodes de collecte
- **Compteurs détaillés** par genre (Aedes, Culex, Anopheles)
- **Types de gîtes** : pneu, bidon, bassin, assiette, boite
- **Classes de sites** : ordures ménagères, ustensiles abandonnés, épaves de véhicules, végétation

## 🚀 Utilisation

### Méthode 1 : Script Node.js (Recommandé)
```bash
# Depuis la racine du projet
node scripts/run_test_data.js
```

### Méthode 2 : Exécution SQL Directe
```bash
# Se connecter à PostgreSQL
psql -U postgres -d centre_muraz

# Exécuter le script
\i scripts/generate_test_data.sql
```

## 📈 Résultats Attendus

Après exécution, vous devriez voir :
- **household_visits** : 60 enregistrements
- **breeding_sites** : 60 enregistrements
- **eggs_collection** : 60 enregistrements
- **adult_mosquitoes** : 60 enregistrements

## 🧪 Test de la Page Analyses

1. **Redémarrer le serveur** si nécessaire
2. **Aller sur** `http://localhost:3000/analyses`
3. **Vérifier** que les graphiques s'affichent avec les données
4. **Tester** la navigation entre les pages

## 📊 Structure des Données

### Visites de Ménages
- 5 visites par mois (15, 16, 17, 18, 19)
- Alternance entre secteurs et environnements
- Dates réparties sur toute l'année 2024

### Gîtes Larvaires
- Données réalistes de sites positifs/négatifs
- Comptages de larves et nymphes
- Variation saisonnière des populations

### Collection d'Œufs
- Comptages d'œufs par visite
- Variation selon les secteurs et saisons
- Données cohérentes avec les gîtes larvaires

### Moustiques Adultes
- Captures avec pièges Prokopack et BG
- Identification du genre et de l'espèce
- Densités variables selon les mois

## 🔧 Dépannage

### Erreur de Connexion à la Base
- Vérifier que PostgreSQL est démarré
- Vérifier les paramètres de connexion dans `.env`
- Vérifier que la base `centre_muraz` existe

### Erreur de Tables Manquantes
- Vérifier que les tables sont créées
- Vérifier la structure des tables
- Exécuter les scripts de création de base

### Données Non Affichées
- Vérifier que l'API `/api/analyses` fonctionne
- Vérifier les logs du serveur
- Vérifier la console du navigateur

## 📝 Notes

- Les données sont **réalistes** mais **simulées**
- Chaque visite a des données dans **toutes les tables**
- Les **clés étrangères** sont correctement maintenues
- Les **dates** sont cohérentes entre toutes les tables

## 🎯 Objectif

Ces données permettent de tester :
- ✅ **Affichage des graphiques**
- ✅ **Calcul des indices entomologiques**
- ✅ **Navigation entre les pages**
- ✅ **Fonctionnement de l'API**
- ✅ **Cohérence des données**

---

**Centre MURAZ - Plateforme de Surveillance Arboviroses** 🦟🔬
