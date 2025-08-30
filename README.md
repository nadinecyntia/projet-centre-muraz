# 🦟 Centre MURAZ - Plateforme de Surveillance Arboviroses

## 📋 Description

La **Plateforme Centre MURAZ** est une solution complète de surveillance et de visualisation des données entomologiques pour la lutte contre les arboviroses. Elle centralise, traite et visualise les données collectées via KoboCollect pour faciliter la prise de décision en santé publique.

## 🚀 Fonctionnalités Principales

### 🔬 **Analyses Entomologiques**
- **Section Larves** : Visualisation des populations larvaires et calcul des indices entomologiques
- **Section Œufs** : Suivi des œufs collectés par secteur et évolution temporelle
- **Section Adultes** : Analyse des densités de moustiques adultes et répartition par genre

### 📊 **Indices Entomologiques Bimensuels**
- **Indice de Breteau (IB)** : Densité des gîtes par rapport aux habitations
- **Indice de Maison (IM)** : Proportion de maisons infectées
- **Indice de Récipient (IR)** : Proportion de récipients à risque
- **Indice de Positivité Pondoire** : Efficacité des pièges
- **Indice de Colonisation Nymphale** : Infestation nymphale
- **Indice Adultes par Piège BG** : Densité des moustiques adultes

### 🧬 **Biologie Moléculaire**
- **PCR Fréquences Alléliques** : Résistance aux insecticides (Kdr, Ace-1, GSTe, CYP6)
- **RT-PCR Virus** : Identification virale (Dengue, Zika, Chikungunya, etc.)
- **PCR Repas de Sang** : Origine des repas (Humain, Animal, Mixte)

### 🔐 **Administration**
- Gestion des utilisateurs et authentification
- Saisie des données entomologiques et biologiques
- Validation et traitement des données
- Synchronisation avec KoboCollect

## 🛠️ Technologies Utilisées

### **Backend**
- **Node.js** + **Express.js** : Serveur web et API
- **PostgreSQL** : Base de données relationnelle
- **JWT** + **bcryptjs** : Authentification sécurisée
- **Multer** : Gestion des fichiers
- **XLSX** + **csv-parser** : Traitement Excel/CSV
- **Axios** : Intégration API KoboCollect

### **Frontend**
- **HTML5** + **CSS3** + **JavaScript ES6+**
- **Tailwind CSS** : Framework CSS utilitaire
- **Chart.js v4** : Visualisations graphiques
- **Font Awesome** : Icônes

### **Sécurité**
- **Helmet** : Protection des en-têtes HTTP
- **CORS** : Gestion des origines croisées
- **Rate Limiting** : Protection contre les attaques
- **Session Management** : Gestion des sessions

## 📁 Structure du Projet

```
centre_muraz_plateform/
├── public/                 # Interface utilisateur
│   ├── css/               # Styles Tailwind CSS
│   ├── js/                # JavaScript frontend
│   ├── index.html         # Page d'accueil
│   ├── analyses.html      # Analyses entomologiques
│   ├── indices.html       # Indices entomologiques
│   ├── biologie.html      # Biologie moléculaire
│   └── admin.html         # Administration
├── server.js              # Serveur Express
├── package.json           # Dépendances et scripts
├── tailwind.config.js     # Configuration Tailwind
└── README.md             # Documentation
```

## 🚀 Installation et Lancement

### **Prérequis**
- Node.js (v16 ou supérieur)
- PostgreSQL (v12 ou supérieur)
- npm ou yarn

### **Installation**
```bash
# Cloner le projet
git clone [URL_DU_REPO]
cd centre_muraz_plateform

# Installer les dépendances
npm install

# Configuration de la base de données
npm run db:setup

# Lancer en mode développement
npm run dev
```

### **Scripts Disponibles**
```bash
npm start          # Production
npm run dev        # Développement avec nodemon
npm run db:setup   # Configuration initiale de la DB
npm run db:migrate # Migrations de la base
npm run build:css  # Compilation Tailwind CSS
```

## 🔗 Accès à la Plateforme

- **URL** : `http://localhost:3000`
- **Page d'accueil** : `/`
- **Analyses** : `/analyses.html`
- **Indices** : `/indices.html`
- **Biologie Moléculaire** : `/biologie.html`
- **Administration** : `/admin.html`

## 📊 Format des Données

### **Identifiants de Prélèvement**
Les données biologiques sont liées aux données entomologiques via des identifiants uniques :
- **Format** : `XXX-YYYY-NNN` (ex: `COL-2024-001`)
- **Types** : `COL` (Collecte), `SECT` (Secteur), `ECH` (Échantillon), `BG` (Piège BG)

### **Données Entomologiques**
- **Larves** : Nombre, espèce, secteur, date
- **Œufs** : Nombre, type de gîte, secteur, date
- **Adultes** : Espèce, sexe, secteur, date, méthode de capture

### **Données Biologiques**
- **PCR Allélique** : Gène, susceptibles, hétérozygotes, résistants
- **RT-PCR Virus** : Virus, résultat, charge virale
- **PCR Repas de Sang** : Origine, espèce animale, pourcentages

## 🔐 Sécurité et Authentification

### **Utilisateurs**
- **Admin** : Accès complet à toutes les fonctionnalités
- **Technicien** : Saisie et consultation des données
- **Consultant** : Consultation et visualisation uniquement

### **Sessions**
- Gestion des sessions avec PostgreSQL
- Expiration automatique après inactivité
- Protection CSRF et XSS

## 📈 Intégration KoboCollect

### **Synchronisation Automatique**
- Import automatique des données collectées
- Validation par les administrateurs
- Traitement et intégration en base
- Gestion des erreurs et reprises

### **Format des Données Kobo**
- Support Excel (.xlsx) et CSV
- Mapping automatique des champs
- Validation des données
- Historique des imports

## 🎯 Utilisation

### **1. Consultation des Données**
- Naviguez vers la page appropriée selon vos besoins
- Utilisez les filtres pour affiner les résultats
- Exportez les données au format CSV

### **2. Saisie des Données**
- Connectez-vous en tant qu'administrateur
- Remplissez les formulaires appropriés
- Validez et sauvegardez les informations

### **3. Visualisation**
- Consultez les graphiques interactifs
- Analysez les tendances temporelles
- Comparez les données par secteur

## 🚧 Développement

### **Ajout de Nouvelles Fonctionnalités**
1. Créer les composants HTML dans `public/`
2. Ajouter la logique JavaScript dans `public/js/`
3. Mettre à jour la base de données si nécessaire
4. Tester et valider

### **Personnalisation des Styles**
- Modifier `tailwind.config.js` pour les couleurs
- Éditer `public/css/input.css` pour les composants
- Utiliser les classes Tailwind pour la mise en page

## 📞 Support et Contact

Pour toute question ou assistance :
- **Email** : [contact@centremuraz.org]
- **Téléphone** : [Numéro de contact]
- **Documentation** : [Lien vers la documentation]

## 📄 Licence

Ce projet est développé pour le **Centre MURAZ** et le **Ministère de la Santé**.
Tous droits réservés.

---

**Centre MURAZ** - Surveillance Arboviroses 🦟  
*Votre avenir en dépend* ✨
