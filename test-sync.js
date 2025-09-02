const axios = require('axios');

async function testSync() {
    try {
        console.log('🔄 Test de la synchronisation KoboCollect...');
        
        // Test 1: Statut
        console.log('\n1️⃣ Test du statut...');
        const statusResponse = await axios.get('http://localhost:3000/api/sync/status');
        console.log('✅ Statut:', statusResponse.data);
        
        // Test 2: Synchronisation des gîtes
        console.log('\n2️⃣ Test de la synchronisation des gîtes...');
        const syncResponse = await axios.post('http://localhost:3000/api/sync-kobo/gites');
        console.log('✅ Synchronisation gîtes:', syncResponse.data);
        
        // Test 3: Vérifier les données après synchronisation
        console.log('\n3️⃣ Vérification des données...');
        const dataResponse = await axios.get('http://localhost:3000/api/data');
        console.log('✅ Données récupérées:', dataResponse.data.total, 'enregistrements');
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

testSync();
