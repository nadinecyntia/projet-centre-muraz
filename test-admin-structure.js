const axios = require('axios');
const cheerio = require('cheerio');

async function testAdminStructure() {
    try {
        console.log('🔍 Test de la structure de la page admin...\n');
        
        // Récupérer la page admin
        const response = await axios.get('http://localhost:3000/admin');
        const html = response.data;
        
        // Analyser le HTML
        const $ = cheerio.load(html);
        
        console.log('1️⃣ Vérification de la structure HTML...');
        
        // Vérifier les sections principales
        const sections = $('section');
        console.log(`✅ Nombre de sections: ${sections.length}`);
        
        // Vérifier la section de connexion
        const loginSection = $('#login-admin');
        if (loginSection.length > 0) {
            console.log('✅ Section de connexion: PRÉSENTE');
        } else {
            console.log('❌ Section de connexion: MANQUANTE');
        }
        
        // Vérifier la section admin-dashboard
        const adminDashboard = $('#admin-dashboard');
        if (adminDashboard.length > 0) {
            console.log('✅ Section admin-dashboard: PRÉSENTE');
            console.log(`   Classes: ${adminDashboard.attr('class')}`);
        } else {
            console.log('❌ Section admin-dashboard: MANQUANTE');
        }
        
        // Vérifier la section de synchronisation
        const syncSection = adminDashboard.find('h3:contains("Synchronisation KoboCollect")');
        if (syncSection.length > 0) {
            console.log('✅ Section synchronisation: PRÉSENTE dans admin-dashboard');
        } else {
            console.log('❌ Section synchronisation: MANQUANTE');
        }
        
        // Vérifier le footer
        const footer = $('footer');
        if (footer.length > 0) {
            console.log('✅ Footer: PRÉSENT');
            console.log(`   Position: ${footer.position()?.top || 'N/A'}`);
        } else {
            console.log('❌ Footer: MANQUANT');
        }
        
        // Vérifier les boutons de synchronisation
        const syncButtons = adminDashboard.find('button[id*="sync"]');
        console.log(`✅ Boutons de synchronisation: ${syncButtons.length} trouvés`);
        
        // Vérifier la structure des balises
        const openSections = html.match(/<section/g) || [];
        const closeSections = html.match(/<\/section>/g) || [];
        console.log(`✅ Balises section: ${openSections.length} ouvertes, ${closeSections.length} fermées`);
        
        if (openSections.length === closeSections.length) {
            console.log('✅ Structure des sections: ÉQUILIBRÉE');
        } else {
            console.log('❌ Structure des sections: DÉSÉQUILIBRÉE');
        }
        
        console.log('\n🎯 Test terminé !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testAdminStructure();
