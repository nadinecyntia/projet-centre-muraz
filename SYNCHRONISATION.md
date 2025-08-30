# 🔄 Guide de Synchronisation des Données - Centre MURAZ

## 📋 Vue d'ensemble

Ce guide explique comment configurer et utiliser la synchronisation automatique des données entre **KoboCollect** et la **Plateforme Centre MURAZ**.

## 🏗️ Architecture de Synchronisation

```
KoboCollect → API REST → Base de Données PostgreSQL → Interface Web
     ↓              ↓              ↓                    ↓
  Formulaires   Récupération   Stockage &         Visualisation
  de collecte   des données    Calcul des        & Analyse
                                indices
```

## ⚙️ Configuration Requise

### 1. Base de Données PostgreSQL
- **Base de données** : `centre_muraz`
- **Utilisateur** : `postgres` (ou votre utilisateur)
- **Port** : `5432` (par défaut)

### 2. KoboCollect
- **URL API** : `https://kf.kobotoolbox.org/api/v2`
- **Token API** : Récupérez depuis votre compte KoboCollect
- **ID du formulaire** : ID du formulaire de collecte entomologique

### 3. Variables d'Environnement
Créez un fichier `.env` à la racine du projet :

```env
# Configuration Base de Données
DB_USER=postgres
DB_HOST=localhost
DB_NAME=centre_muraz
DB_PASSWORD=votre_mot_de_passe
DB_PORT=5432

# Configuration KoboCollect
KOBO_API_URL=https://kf.kobotoolbox.org/api/v2
KOBO_API_TOKEN=votre_token_api_kobo
KOBO_FORM_ID=votre_id_formulaire

# Configuration Serveur
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Installation et Configuration

### Étape 1 : Installation des Dépendances
```bash
npm install
```

### Étape 2 : Configuration de la Base de Données
```bash
# Créer la base de données
createdb centre_muraz

# Créer les tables et index
node scripts/setup-database.js
```

### Étape 3 : Démarrage de la Plateforme
```bash
npm run dev
```

## 📊 Structure des Données

### Tables Principales

#### 1. `entomological_data`
Données de base de chaque session de collecte :
- **collection_id** : Identifiant unique de la collecte
- **start_date/end_date** : Dates de début/fin
- **sector** : Secteur géographique
- **environment** : Milieu (urbain/rural)
- **gps_code** : Coordonnées GPS
- **concession_code** : Code de concession

#### 2. `breeding_sites`
Gîtes larvaires identifiés :
- **larvae_presence** : Présence de larves (oui/non)
- **pupae_presence** : Présence de nymphes (oui/non)
- **larvae_count** : Nombre de larves
- **pupae_count** : Nombre de nymphes

#### 3. `eggs_data`
Données sur les œufs :
- **nest_number** : Numéro du nid
- **nest_code** : Code du nid
- **pass_order** : Ordre de passage

#### 4. `adult_mosquitoes`
Moustiques adultes collectés :
- **collection_method** : Méthode de collecte
- **capture_location** : Lieu de capture
- **male_mosquito_count** : Nombre de mâles
- **female_mosquito_count** : Nombre de femelles

#### 5. `molecular_biology`
Analyses biologiques :
- **analysis_type** : Type d'analyse (PCR, RT-PCR, etc.)
- **sample_date** : Date de l'échantillon
- **mosquito_genus** : Genre de moustique
- **mosquito_species** : Espèce de moustique

#### 6. `entomological_indices`
Indices calculés automatiquement :
- **breteau_index** : Indice de Breteau (IB)
- **house_index** : Indice de Maison (IM)
- **container_index** : Indice de Récipient (IR)

## 🔄 Processus de Synchronisation

### 1. Récupération des Données
- **Source** : API KoboCollect
- **Fréquence** : Manuelle ou programmée
- **Format** : JSON via API REST

### 2. Traitement des Données
- **Validation** : Vérification des champs obligatoires
- **Transformation** : Conversion des formats
- **Enrichissement** : Calcul des indices

### 3. Stockage en Base
- **Insertion** : Données entomologiques
- **Mise à jour** : Gestion des doublons
- **Indexation** : Optimisation des requêtes

### 4. Calcul Automatique des Indices
- **Indice de Breteau** : `(Gîtes positifs × 100) / Maisons visitées`
- **Indice de Maison** : `(Maisons avec gîtes × 100) / Total maisons`
- **Indice de Récipient** : `(Récipients positifs × 100) / Total récipients`

## 🎯 Utilisation de l'Interface

### Page Admin - Section Synchronisation

#### 1. Statut de Synchronisation
- **Statut** : État de la dernière synchronisation
- **Dernière sync** : Date et heure de la dernière synchronisation
- **Enregistrements** : Nombre d'enregistrements traités

#### 2. Actions Disponibles
- **Synchroniser Maintenant** : Lance une synchronisation manuelle
- **Actualiser le Statut** : Met à jour l'affichage du statut

#### 3. Logs de Synchronisation
- **Temps réel** : Suivi des opérations
- **Types de messages** : Info, Succès, Erreur, Avertissement
- **Historique** : Conservation des logs de session

## 🔧 API Endpoints

### Synchronisation
- **POST** `/api/sync-kobo` : Lance la synchronisation
- **GET** `/api/sync-status` : Statut de la synchronisation

### Données Entomologiques
- **GET** `/api/entomological-data` : Récupère les données de collecte
- **GET** `/api/entomological-indices` : Récupère les indices calculés

### Biologie Moléculaire
- **GET** `/api/molecular-biology` : Récupère les analyses biologiques
- **POST** `/api/molecular-biology` : Insère une nouvelle analyse

## 🚨 Gestion des Erreurs

### Types d'Erreurs Courantes

#### 1. Erreurs de Connexion
- **Base de données** : Vérifiez PostgreSQL et les paramètres de connexion
- **KoboCollect** : Vérifiez le token API et l'URL

#### 2. Erreurs de Données
- **Format invalide** : Vérifiez la structure des données KoboCollect
- **Champs manquants** : Assurez-vous que tous les champs obligatoires sont présents

#### 3. Erreurs de Synchronisation
- **Limite API** : Respectez les limites de l'API KoboCollect
- **Doublons** : Gestion automatique des enregistrements existants

### Solutions Recommandées

1. **Vérifiez les logs** : Consultez la console et les logs de synchronisation
2. **Testez la connexion** : Utilisez l'endpoint `/api/test-db`
3. **Vérifiez les paramètres** : Contrôlez le fichier `.env`
4. **Redémarrez le serveur** : Après modification de la configuration

## 📈 Monitoring et Maintenance

### 1. Surveillance Continue
- **Statut de synchronisation** : Vérifiez régulièrement l'état
- **Performance** : Surveillez les temps de réponse
- **Erreurs** : Analysez les logs d'erreur

### 2. Maintenance Préventive
- **Nettoyage des logs** : Supprimez les anciens logs
- **Optimisation de la base** : Analysez les performances des requêtes
- **Mise à jour** : Maintenez les dépendances à jour

### 3. Sauvegarde
- **Base de données** : Sauvegardez régulièrement les données
- **Configuration** : Conservez les fichiers de configuration
- **Logs** : Archivez les logs importants

## 🔮 Évolutions Futures

### 1. Synchronisation Automatique
- **Planification** : Synchronisation automatique selon un planning
- **Webhooks** : Notifications en temps réel des nouvelles données
- **Incremental** : Synchronisation uniquement des nouvelles données

### 2. Validation Avancée
- **Règles métier** : Validation selon les critères scientifiques
- **Alertes** : Notifications des anomalies détectées
- **Correction** : Interface de correction des erreurs

### 3. Intégration Étendue
- **Autres sources** : Intégration d'autres systèmes de collecte
- **Export** : Export vers d'autres plateformes
- **API publique** : Exposition des données via API publique

## 📞 Support et Contact

Pour toute question ou problème :
- **Documentation** : Consultez ce guide et le README principal
- **Logs** : Analysez les logs de synchronisation
- **Tests** : Utilisez les endpoints de test
- **Développement** : Contactez l'équipe technique

---

**Centre MURAZ - Plateforme de Surveillance des Arboviroses**  
*Ministère de la Santé - Burkina Faso*  
*Version 1.0 - 2024*
