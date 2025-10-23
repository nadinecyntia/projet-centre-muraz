// Test rapide de la route /api/collect/eggs
const http = require('http');

const testData = {
    eggs_concession_code: "API-TEST-001",
    eggs_sector: "Sector 6",
    eggs_environment: "urban",
    eggs_gps_code: "12.345678,-1.234567",
    eggs_visit_start_date: "2025-10-21",
    nest_number: "NEST-API-01",
    nest_code: "NAPI001",
    pass_order: "1",
    eggs_count: 75,
    observations: "Test API - Système normalisé"
};

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/collect/eggs',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(testData))
    }
};

console.log('\n' + '='.repeat(80));
console.log('🧪 TEST DE L\'API - Route /collect/eggs');
console.log('='.repeat(80) + '\n');
console.log('📤 Envoi des données de test...\n');

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`📊 Status code: ${res.statusCode}`);
        console.log('📥 Réponse:\n');
        
        try {
            const response = JSON.parse(data);
            console.log(JSON.stringify(response, null, 2));
            
            if (response.success) {
                console.log('\n✅ TEST RÉUSSI !');
                console.log(`   - Collecte d'œufs enregistrée : ID ${response.egg_collection_id}`);
                console.log(`   - Maison : ID ${response.house_id}`);
                console.log('\n🎯 Le nouveau système normalisé fonctionne correctement !');
            } else {
                console.log('\n❌ TEST ÉCHOUÉ !');
                console.log(`   Message: ${response.message}`);
            }
        } catch (e) {
            console.log('Réponse brute:', data);
        }
        
        console.log('\n' + '='.repeat(80) + '\n');
    });
});

req.on('error', (error) => {
    console.error('❌ ERREUR:', error.message);
    console.error('\nLe serveur est-il démarré ? Vérifiez avec: node server.js\n');
});

req.write(JSON.stringify(testData));
req.end();

