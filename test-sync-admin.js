const axios = require('axios');

async function testSyncAdmin() {
    try {
        console.log('🔍 Test de la synchronisation admin...\n');
        
        // 1. Test du statut
        console.log('1️⃣ Test du statut de synchronisation...');
        const statusResponse = await axios.get('http://localhost:3000/api/sync/status');
        console.log('✅ Statut:', statusResponse.data);
        
        // 2. Test de la synchronisation complète
        console.log('\n2️⃣ Test de la synchronisation complète...');
        const syncResponse = await axios.post('http://localhost:3000/api/sync-kobo');
        console.log('✅ Synchronisation complète:', syncResponse.data);
        
        // 3. Test de la synchronisation par type
        console.log('\n3️⃣ Test de la synchronisation par type...');
        
        const types = ['gites', 'oeufs', 'adultes'];
        for (const type of types) {
            try {
                const typeResponse = await axios.post(`http://localhost:3000/api/sync-kobo/${type}`);
                console.log(`✅ ${type}:`, typeResponse.data);
            } catch (error) {
                console.log(`❌ ${type}:`, error.response?.data || error.message);
            }
        }
        
        // 4. Vérification du statut final
        console.log('\n4️⃣ Vérification du statut final...');
        const finalStatus = await axios.get('http://localhost:3000/api/sync/status');
        console.log('✅ Statut final:', finalStatus.data);
        
        console.log('\n🎯 Test terminé !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

testSyncAdmin();
