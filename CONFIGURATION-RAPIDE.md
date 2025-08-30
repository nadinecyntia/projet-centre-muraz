# 🚀 Configuration Rapide - Centre MURAZ Platform

## ⚡ Configuration en 5 Étapes

### 1. **Installation des Dépendances**
```bash
npm install
```

### 2. **Configuration de la Base de Données PostgreSQL**
- Installez PostgreSQL si ce n'est pas déjà fait
- Créez une base de données : `createdb centre_muraz`
- Modifiez le fichier `env.example` et renommez-le en `.env`

### 3. **Configuration des Formulaires KoboCollect**
Dans votre fichier `.env`, configurez :
```env
# Récupérez ces informations depuis votre compte KoboCollect
KOBO_API_TOKEN=votre_token_api_kobo
KOBO_FORM_GITES_ID=votre_id_formulaire_gites
KOBO_FORM_OEUFS_ID=votre_id_formulaire_oeufs
KOBO_FORM_ADULTES_ID=votre_id_formulaire_adultes
```

### 4. **Création des Tables de la Base de Données**
```bash
node scripts/setup-database.js
```

### 5. **Démarrage de la Plateforme**
```bash
npm run dev
```

## 🔗 Accès à la Plateforme

- **Interface principale** : http://localhost:3000
- **Page Admin** : http://localhost:3000/admin.html
- **Synchronisation** : http://localhost:3000/admin.html#sync

## 📊 Structure des Données

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

## 🔄 Synchronisation

### **Synchronisation Complète**
- Traite tous les formulaires en une fois
- Calcul automatique des indices entomologiques

### **Synchronisation par Formulaire**
- Gîtes Larvaires uniquement
- Œufs uniquement  
- Moustiques Adultes uniquement

## 🚨 Résolution des Problèmes

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

## 📞 Support

Pour toute question :
1. Consultez les logs de synchronisation
2. Vérifiez la console du navigateur
3. Consultez la documentation complète dans `SYNCHRONISATION.md`

---

**Centre MURAZ - Plateforme de Surveillance des Arboviroses**  
*Ministère de la Santé - Burkina Faso*
