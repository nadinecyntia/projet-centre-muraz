const axios = require('axios');

async function testSyncDetailed() {
    try {
        console.log('🔍 Test détaillé de la synchronisation...\n');
        
        // Test de la synchronisation avec logs détaillés
        console.log('1️⃣ Test de la synchronisation Gîtes...');
        try {
            const response = await axios.post('http://localhost:3000/api/sync-kobo/gites');
            console.log('✅ Réponse:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
        }
        
        console.log('\n2️⃣ Test de la synchronisation Œufs...');
        try {
            const response = await axios.post('http://localhost:3000/api/sync-kobo/oeufs');
            console.log('✅ Réponse:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
        }
        
        console.log('\n3️⃣ Test de la synchronisation Adultes...');
        try {
            const response = await axios.post('http://localhost:3000/api/sync-kobo/adultes');
            console.log('✅ Réponse:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('❌ Erreur:', error.response?.data || error.message);
        }
        
        console.log('\n4️⃣ Vérification du statut final...');
        try {
            const statusResponse = await axios.get('http://localhost:3000/api/sync/status');
            console.log('✅ Statut final:', JSON.stringify(statusResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Erreur statut:', error.response?.data || error.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testSyncDetailed();