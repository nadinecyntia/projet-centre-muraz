# 🚀 Configuration KoboCollect pour la Synchronisation

## 📋 **Étapes de Configuration**

### **1. Obtenir votre Token API KoboCollect**
1. Connectez-vous à [KoboCollect](https://kf.kobotoolbox.org/)
2. Allez dans votre profil (icône utilisateur en haut à droite)
3. Cliquez sur "API Access"
4. Copiez votre **Token API** (commence par `Token`)

### **2. Obtenir les IDs des Formulaires**
1. Dans KoboCollect, ouvrez chaque formulaire
2. L'URL contient l'ID : `https://kf.kobotoolbox.org/assets/ASSET_ID/`
3. Copiez l'`ASSET_ID` pour chaque formulaire

### **3. Modifier la Configuration**
Éditez le fichier `config/kobo-config.js` :

```javascript
module.exports = {
    apiUrl: 'https://kf.kobotoolbox.org/api/v2',
    
    // Remplacez par votre vrai token API
    apiToken: 'Token votre_vrai_token_ici',
    
    forms: {
        // Remplacez par vos vrais IDs de formulaires
        gites: 'votre_id_formulaire_gites',
        oeufs: 'votre_id_formulaire_oeufs',
        adultes: 'aN4GByzPSxLW28Zc8cPMKP' // ✅ Déjà configuré
    }
};
```

## 🧪 **Test de la Configuration**

Exécutez le script de test :

```bash
node scripts/test-sync-config.js
```

**Résultat attendu :**
```
🔍 Test de la configuration KoboCollect...

📋 Configuration actuelle:
   API URL: https://kf.kobotoolbox.org/api/v2
   API Token: ✅ PRÉSENT
   Formulaires:
     gites: ✅ CONFIGURÉ
     oeufs: ✅ CONFIGURÉ
     adultes: ✅ CONFIGURÉ

🔄 Test de connectivité avec KoboCollect...
✅ Connexion à KoboCollect réussie !
   Nombre de formulaires disponibles: X

🔍 Test des formulaires spécifiques...
   ✅ gites: X enregistrements disponibles
   ✅ oeufs: X enregistrements disponibles
   ✅ adultes: X enregistrements disponibles
```

## 🚨 **Problèmes Courants**

### **Token API invalide**
- Vérifiez que le token commence par `Token`
- Vérifiez que le token n'a pas expiré
- Vérifiez les permissions du token

### **ID de formulaire incorrect**
- Vérifiez l'URL du formulaire dans KoboCollect
- Assurez-vous que le formulaire est public ou accessible avec votre token

### **Erreur de connexion**
- Vérifiez votre connexion internet
- Vérifiez que l'URL de l'API est correcte

## ✅ **Une fois configuré**

Vos boutons de synchronisation fonctionneront vraiment et :
1. **Récupéreront** les nouvelles données depuis KoboCollect
2. **Inséreront** ces données dans votre base PostgreSQL
3. **Mettront à jour** automatiquement vos interfaces (analyses, indices, dashboard)

## 🔄 **Test de Synchronisation**

Après configuration, testez avec :
1. **Synchronisation Complète** : Tous les formulaires
2. **Synchronisation Larves** : Gîtes larvaires uniquement
3. **Synchronisation Œufs** : Collecte d'œufs uniquement
4. **Synchronisation Adultes** : Moustiques adultes uniquement

**Bonne synchronisation ! 🎯**






