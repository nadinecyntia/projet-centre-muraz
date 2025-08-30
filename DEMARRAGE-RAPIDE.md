# 🚀 Démarrage Rapide - Centre MURAZ Platform

## ⚡ **Démarrage en 3 Étapes**

### **1. Configuration de l'Environnement**
```bash
# Copier le fichier d'exemple
copy env.example .env

# Éditer .env avec vos paramètres
notepad .env
```

**Paramètres obligatoires dans `.env` :**
- `DB_PASSWORD` : Votre mot de passe PostgreSQL
- `KOBO_API_TOKEN` : Votre token API KoboCollect
- `KOBO_FORM_GITES_ID` : ID du formulaire gîtes larvaires
- `KOBO_FORM_OEUFS_ID` : ID du formulaire œufs
- `KOBO_FORM_ADULTES_ID` : ID du formulaire moustiques adultes

### **2. Création de la Base de Données**
```bash
# Créer la base de données
createdb centre_muraz

# Créer les tables
node scripts/setup-database.js
```

### **3. Démarrage de la Plateforme**
```bash
# Option 1: Script automatique
start.bat

# Option 2: Manuel
npm run dev
```

## 🔗 **Accès à la Plateforme**

- **Interface principale** : http://localhost:3000
- **Page Admin** : http://localhost:3000/admin.html
- **Synchronisation** : http://localhost:3000/admin.html#sync

## 📊 **Structure des Données**

### **Variables Communes** (dans tous les formulaires)
- `start_date`, `end_date`, `start_time`, `end_time`
- `sector`, `environment`, `gps_code`, `concession_code`
- `household_size`, `number_of_beds`, `number_of_households`
- `head_of_household_contact`

### **Formulaire 1 : Gîtes Larvaires**
- `breeding_site_id`, `breeding_site_status`
- `larvae_presence`, `pupae_presence`
- `larvae_count`, `pupae_count`
- Compteurs par genre : `aedes_larvae_count`, `culex_larvae_count`, etc.

### **Formulaire 2 : Œufs**
- `nest_number`, `nest_code`, `pass_order`

### **Formulaire 3 : Moustiques Adultes**
- `collection_method`, `capture_location`
- Présence par genre : `aedes_presence`, `anopheles_presence`, etc.
- Compteurs : `male_mosquito_count`, `female_mosquito_count`
- États physiologiques : `starved_female_count`, `gravid_female_count`, etc.

## 🔄 **Fonctionnalités de Synchronisation**

### **Synchronisation Complète**
- Traite tous les formulaires en une fois
- Calcul automatique des indices entomologiques

### **Synchronisation par Formulaire**
- **Gîtes Larvaires** : Bouton vert avec icône 🐛
- **Œufs** : Bouton jaune avec icône 🥚
- **Moustiques Adultes** : Bouton violet avec icône 🦟

## 🚨 **Résolution des Problèmes**

### **Erreur de Connexion à la Base**
```bash
# Vérifiez que PostgreSQL est démarré
# Vérifiez les paramètres dans .env
node scripts/setup-database.js
```

### **Erreur de Synchronisation KoboCollect**
- Vérifiez votre token API
- Vérifiez les IDs des formulaires
- Consultez les logs dans l'interface admin

### **Port déjà utilisé**
```bash
# Arrêtez les processus Node.js
taskkill /f /im node.exe
# Puis relancez
npm run dev
```

## 📞 **Support**

Pour toute question :
1. Consultez les logs de synchronisation
2. Vérifiez la console du navigateur
3. Consultez la documentation complète dans `SYNCHRONISATION.md`

---

**Centre MURAZ - Plateforme de Surveillance des Arboviroses**  
*Ministère de la Santé - Burkina Faso*
