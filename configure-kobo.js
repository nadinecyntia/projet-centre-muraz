const fs = require('fs');
const path = require('path');

console.log('🔧 Configuration du Token API KoboCollect');
console.log('==========================================\n');

console.log('📋 Pour obtenir votre token API KoboCollect :');
console.log('1. Connectez-vous à https://kf.kobotoolbox.org/');
console.log('2. Allez dans votre profil (icône utilisateur en haut à droite)');
console.log('3. Cliquez sur "API Access"');
console.log('4. Copiez votre Token API (commence par "Token")\n');

console.log('⚠️  IMPORTANT : Le token API est sensible, ne le partagez pas !\n');

// Lire la configuration actuelle
const configPath = path.join(__dirname, 'config', 'kobo-config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Extraire le token actuel
const tokenMatch = configContent.match(/apiToken:\s*['"`]([^'"`]*)['"`]/);
const currentToken = tokenMatch ? tokenMatch[1] : '';

if (currentToken && currentToken !== 'votre_token_api_kobo_ici') {
    console.log(`✅ Token actuel configuré: ${currentToken.substring(0, 10)}...`);
    console.log('Pour le changer, modifiez directement le fichier config/kobo-config.js\n');
} else {
    console.log('❌ Aucun token configuré');
    console.log('Veuillez modifier le fichier config/kobo-config.js et remplacer "votre_token_api_kobo_ici" par votre vrai token\n');
}

console.log('📁 Fichier de configuration : config/kobo-config.js');
console.log('🔑 Ligne à modifier : apiToken: "votre_token_api_kobo_ici"');

console.log('\n🎯 Une fois le token configuré, vous pourrez :');
console.log('1. Tester la synchronisation avec : node test-sync.js');
console.log('2. Utiliser l\'interface admin pour synchroniser');
console.log('3. Voir les données dans les pages analyses et indices');
