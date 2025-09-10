#!/usr/bin/env node

/**
 * Script de lancement des tests
 * Centre MURAZ - Plateforme Entomologique
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Centre MURAZ - Lancement des Tests Unitaires');
console.log('=' .repeat(60));

// Vérifier que Jest est installé
try {
    require('jest');
} catch (error) {
    console.log('❌ Jest n\'est pas installé. Installation...');
    execSync('npm install --save-dev jest supertest', { stdio: 'inherit' });
}

// Vérifier que les dépendances sont installées
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDevDeps = ['jest', 'supertest', 'eslint'];

const missingDeps = requiredDevDeps.filter(dep => 
    !packageJson.devDependencies || !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
    console.log(`❌ Dépendances manquantes: ${missingDeps.join(', ')}`);
    console.log('Installation...');
    execSync(`npm install --save-dev ${missingDeps.join(' ')}`, { stdio: 'inherit' });
}

// Fonction pour exécuter les tests
function runTests(testType = 'all') {
    console.log(`\n🚀 Lancement des tests: ${testType}`);
    console.log('-'.repeat(40));
    
    try {
        let command;
        
        switch (testType) {
            case 'database':
                command = 'npm test -- tests/database.test.js';
                break;
            case 'api':
                command = 'npm test -- tests/api.test.js';
                break;
            case 'frontend':
                command = 'npm test -- tests/frontend.test.js';
                break;
            case 'security':
                command = 'npm test -- tests/security.test.js';
                break;
            case 'integration':
                command = 'npm test -- tests/integration.test.js';
                break;
            case 'coverage':
                command = 'npm run test:coverage';
                break;
            case 'all':
            default:
                command = 'npm test';
                break;
        }
        
        console.log(`📡 Commande: ${command}`);
        execSync(command, { stdio: 'inherit' });
        
        console.log(`✅ Tests ${testType} terminés avec succès`);
        
    } catch (error) {
        console.log(`❌ Erreur lors des tests ${testType}:`);
        console.log(error.message);
        process.exit(1);
    }
}

// Fonction pour afficher le menu
function showMenu() {
    console.log('\n📋 Menu des Tests:');
    console.log('1. Tests complets (all)');
    console.log('2. Tests base de données (database)');
    console.log('3. Tests APIs (api)');
    console.log('4. Tests frontend (frontend)');
    console.log('5. Tests sécurité (security)');
    console.log('6. Tests intégration (integration)');
    console.log('7. Tests avec couverture (coverage)');
    console.log('8. Quitter');
    console.log('\nEntrez votre choix (1-8):');
}

// Fonction pour vérifier la configuration
function checkConfiguration() {
    console.log('\n🔍 Vérification de la configuration...');
    
    // Vérifier les fichiers de test
    const testFiles = [
        'tests/setup.js',
        'tests/database.test.js',
        'tests/api.test.js',
        'tests/frontend.test.js',
        'tests/security.test.js',
        'tests/integration.test.js'
    ];
    
    const missingFiles = testFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
        console.log(`❌ Fichiers de test manquants: ${missingFiles.join(', ')}`);
        return false;
    }
    
    // Vérifier la configuration Jest
    if (!fs.existsSync('package.json')) {
        console.log('❌ package.json manquant');
        return false;
    }
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.jest) {
        console.log('❌ Configuration Jest manquante dans package.json');
        return false;
    }
    
    console.log('✅ Configuration valide');
    return true;
}

// Fonction pour afficher les statistiques
function showStats() {
    console.log('\n📊 Statistiques des Tests:');
    console.log('-'.repeat(40));
    
    const testFiles = fs.readdirSync('tests')
        .filter(file => file.endsWith('.test.js'))
        .map(file => {
            const content = fs.readFileSync(`tests/${file}`, 'utf8');
            const testCount = (content.match(/test\(/g) || []).length;
            const describeCount = (content.match(/describe\(/g) || []).length;
            return {
                file: file.replace('.test.js', ''),
                tests: testCount,
                suites: describeCount
            };
        });
    
    testFiles.forEach(file => {
        console.log(`📁 ${file.file}: ${file.tests} tests, ${file.suites} suites`);
    });
    
    const totalTests = testFiles.reduce((sum, file) => sum + file.tests, 0);
    const totalSuites = testFiles.reduce((sum, file) => sum + file.suites, 0);
    
    console.log(`\n📈 Total: ${totalTests} tests, ${totalSuites} suites`);
}

// Fonction principale
function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // Mode ligne de commande
        const testType = args[0];
        runTests(testType);
        return;
    }
    
    // Mode interactif
    console.log('\n🎯 Mode interactif activé');
    
    if (!checkConfiguration()) {
        console.log('❌ Configuration invalide. Veuillez corriger les erreurs.');
        return;
    }
    
    showStats();
    
    // Simuler un menu interactif simple
    console.log('\n🚀 Lancement des tests complets...');
    runTests('all');
    
    console.log('\n🎉 Tests terminés!');
    console.log('📋 Pour des tests spécifiques, utilisez:');
    console.log('   node run-tests.js database');
    console.log('   node run-tests.js api');
    console.log('   node run-tests.js frontend');
    console.log('   node run-tests.js security');
    console.log('   node run-tests.js integration');
    console.log('   node run-tests.js coverage');
}

// Gestion des erreurs
process.on('uncaughtException', (error) => {
    console.log('❌ Erreur non gérée:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('❌ Promesse rejetée:', reason);
    process.exit(1);
});

// Lancer le script
main();


