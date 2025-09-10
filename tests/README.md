# 🧪 Tests Unitaires - Centre MURAZ

## 📋 Vue d'ensemble

Cette suite de tests unitaires assure la qualité et la fiabilité de la plateforme entomologique du Centre MURAZ. Elle couvre tous les aspects critiques pour un site du ministère de la santé.

## 🎯 Objectifs

- **Fiabilité** : S'assurer que toutes les fonctionnalités marchent correctement
- **Sécurité** : Protéger contre les vulnérabilités et attaques
- **Performance** : Vérifier que le système répond rapidement
- **Cohérence** : Maintenir l'intégrité des données
- **Maintenabilité** : Faciliter les futures modifications

## 📁 Structure des Tests

```
tests/
├── setup.js                 # Configuration globale des tests
├── database.test.js         # Tests de la base de données
├── api.test.js             # Tests des APIs
├── data-processing.test.js # Tests du traitement des données
├── frontend.test.js        # Tests du frontend
├── security.test.js        # Tests de sécurité
├── integration.test.js     # Tests d'intégration
└── README.md              # Ce fichier
```

## 🚀 Commandes de Test

### Tests de base
```bash
npm test                    # Exécuter tous les tests
npm run test:watch         # Tests en mode watch
npm run test:coverage      # Tests avec couverture
```

### Tests spécifiques
```bash
npm test -- --testNamePattern="Base de données"
npm test -- --testNamePattern="APIs"
npm test -- --testNamePattern="Sécurité"
```

### Tests d'intégration
```bash
npm test -- tests/integration.test.js
```

## 📊 Couverture de Tests

### Base de Données (database.test.js)
- ✅ Connexion PostgreSQL
- ✅ Structure des tables
- ✅ Contraintes et clés étrangères
- ✅ Index de performance
- ✅ Insertion et récupération de données
- ✅ Performance des requêtes

### APIs (api.test.js)
- ✅ `/api/analyses` - Données générales
- ✅ `/api/analyses/oeufs` - Œufs par secteur
- ✅ `/api/analyses/oeufs-mois` - Œufs par mois
- ✅ `/api/indices` - Indices entomologiques
- ✅ `/api/sync-status` - Statut de synchronisation
- ✅ Gestion des erreurs
- ✅ Performance des APIs

### Traitement des Données (data-processing.test.js)
- ✅ Fonction `getPeriode()`
- ✅ Fonction `calculateAverage()`
- ✅ Traitement des données œufs
- ✅ Traitement des données indices
- ✅ Validation des données
- ✅ Performance du traitement

### Frontend (frontend.test.js)
- ✅ Classe `AnalysesManager`
- ✅ Création des graphiques
- ✅ Gestion des données
- ✅ Mise à jour des graphiques
- ✅ Gestion des erreurs
- ✅ Validation des données

### Sécurité (security.test.js)
- ✅ Validation des entrées
- ✅ Protection contre les injections SQL
- ✅ Protection contre les attaques XSS
- ✅ Validation des types de données
- ✅ Validation des formats
- ✅ Contraintes métier
- ✅ Protection contre les attaques DoS

### Intégration (integration.test.js)
- ✅ Flux complet de données
- ✅ Performance avec gros volumes
- ✅ Cohérence entre APIs
- ✅ Gestion des erreurs
- ✅ Tests de charge
- ✅ Récupération après erreur

## 🔧 Configuration

### Variables d'environnement de test
```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=centre_muraz_test
DB_USER=postgres
DB_PASSWORD=password
```

### Seuil de couverture
- **Branches** : 80%
- **Fonctions** : 80%
- **Lignes** : 80%
- **Statements** : 80%

## 📈 Métriques de Qualité

### Performance
- **APIs** : < 5 secondes
- **Base de données** : < 5 secondes
- **Traitement** : < 100ms pour 1000 enregistrements
- **Frontend** : < 1 seconde pour l'initialisation

### Sécurité
- ✅ Validation de toutes les entrées
- ✅ Protection contre les injections
- ✅ Protection contre les attaques XSS
- ✅ Validation des types et formats
- ✅ Contraintes métier respectées

### Fiabilité
- ✅ Gestion des erreurs
- ✅ Récupération après erreur
- ✅ Cohérence des données
- ✅ Tests de charge

## 🚨 Alertes et Seuils

### Seuils critiques
- **Couverture** : < 80% → Échec
- **Performance** : > 10 secondes → Échec
- **Erreurs** : > 0 → Échec
- **Sécurité** : Vulnérabilité détectée → Échec

### Alertes de performance
- **APIs lentes** : > 5 secondes
- **Base de données lente** : > 5 secondes
- **Traitement lent** : > 100ms pour 1000 enregistrements

## 🔍 Débogage

### Logs de test
```bash
npm test -- --verbose
```

### Tests spécifiques
```bash
npm test -- --testNamePattern="nom_du_test"
```

### Couverture détaillée
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 📝 Bonnes Pratiques

### Écriture de tests
1. **Nommage clair** : `devrait faire quelque chose`
2. **Un test, une assertion** : Un test = une fonctionnalité
3. **Données de test** : Utiliser des données réalistes
4. **Nettoyage** : Nettoyer après chaque test
5. **Indépendance** : Les tests ne doivent pas dépendre les uns des autres

### Maintenance
1. **Mise à jour** : Mettre à jour les tests avec le code
2. **Révision** : Réviser régulièrement les tests
3. **Optimisation** : Optimiser les tests lents
4. **Documentation** : Documenter les tests complexes

## 🎯 Prochaines Étapes

1. **Tests E2E** : Tests avec navigateur réel
2. **Tests de charge** : Tests avec outils spécialisés
3. **Tests de sécurité** : Tests avec outils de sécurité
4. **Tests de compatibilité** : Tests sur différents navigateurs
5. **Tests de régression** : Tests automatiques sur les modifications

## 📞 Support

Pour toute question sur les tests :
- **Documentation** : Ce fichier README
- **Issues** : Créer une issue sur le repository
- **Tests** : Exécuter `npm test` pour diagnostiquer

---

**Centre MURAZ - Plateforme Entomologique**  
*Tests unitaires pour la qualité et la fiabilité*


