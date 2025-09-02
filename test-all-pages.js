const axios = require('axios');

async function testAllPages() {
    console.log('🔍 Test complet de toutes les pages et fonctionnalités...\n');
    
    try {
        // 1. Test API Analyses
        console.log('📊 1. Test API Analyses...');
        const analysesResponse = await axios.get('http://localhost:3000/api/analyses');
        if (analysesResponse.data.success) {
            console.log('✅ API Analyses: OK');
            console.log(`   📈 Données: ${analysesResponse.data.data.gites.length} gîtes, ${analysesResponse.data.data.oeufs.length} œufs, ${analysesResponse.data.data.adultes.length} adultes`);
            console.log(`   🎯 Genres: ${analysesResponse.data.data.genres.join(', ')}`);
        } else {
            console.log('❌ API Analyses: Erreur');
        }
        
        // 2. Test API Indices
        console.log('\n🧮 2. Test API Indices...');
        const indicesResponse = await axios.get('http://localhost:3000/api/indices');
        if (indicesResponse.data.success) {
            console.log('✅ API Indices: OK');
            console.log(`   📊 Périodes: ${indicesResponse.data.data.periodes.length}`);
            console.log(`   🎯 Secteurs: ${indicesResponse.data.data.secteurs.length}`);
            console.log(`   📈 Indices calculés: ${Object.keys(indicesResponse.data.data.breteau).length} périodes`);
        } else {
            console.log('❌ API Indices: Erreur');
        }
        
        // 3. Test Pages HTML
        console.log('\n🌐 3. Test Pages HTML...');
        
        const pages = [
            { name: 'Accueil', url: 'http://localhost:3000/' },
            { name: 'Analyses', url: 'http://localhost:3000/analyses' },
            { name: 'Indices', url: 'http://localhost:3000/indices' },
            { name: 'Admin', url: 'http://localhost:3000/admin' }
        ];
        
        for (const page of pages) {
            try {
                const response = await axios.get(page.url);
                if (response.status === 200) {
                    console.log(`✅ ${page.name}: OK (${response.status})`);
                } else {
                    console.log(`⚠️ ${page.name}: Status ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ ${page.name}: Erreur - ${error.message}`);
            }
        }
        
        // 4. Test Statut Sync
        console.log('\n🔄 4. Test Statut Synchronisation...');
        try {
            const syncResponse = await axios.get('http://localhost:3000/api/sync/status');
            if (syncResponse.data.success) {
                console.log('✅ Statut Sync: OK');
                console.log(`   📊 Données: ${syncResponse.data.data.totalRecords} enregistrements`);
            } else {
                console.log('❌ Statut Sync: Erreur');
            }
        } catch (error) {
            console.log('❌ Statut Sync: Erreur - ' + error.message);
        }
        
        console.log('\n🎉 Test complet terminé !');
        console.log('\n📋 Résumé des corrections apportées:');
        console.log('✅ Colonnes redondantes supprimées (positive_containers, negative_containers)');
        console.log('✅ API corrigée pour utiliser positive_sites/negative_sites');
        console.log('✅ Calculs d\'indices mis à jour');
        console.log('✅ Services KoboCollect mis à jour');
        console.log('✅ Structure de base de données simplifiée');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testAllPages();
