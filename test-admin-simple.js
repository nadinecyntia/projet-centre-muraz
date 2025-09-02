const axios = require('axios');

async function testAdminSimple() {
    try {
        console.log('🔍 Test simple de la page admin...\n');
        
        // Récupérer la page admin
        const response = await axios.get('http://localhost:3000/admin');
        const html = response.data;
        
        console.log('1️⃣ Vérification de la structure HTML...');
        
        // Vérifier les sections principales
        const sections = (html.match(/<section/g) || []).length;
        const closeSections = (html.match(/<\/section>/g) || []).length;
        console.log(`✅ Balises section: ${sections} ouvertes, ${closeSections} fermées`);
        
        if (sections === closeSections) {
            console.log('✅ Structure des sections: ÉQUILIBRÉE');
        } else {
            console.log('❌ Structure des sections: DÉSÉQUILIBRÉE');
        }
        
        // Vérifier la section de connexion
        if (html.includes('id="login-admin"')) {
            console.log('✅ Section de connexion: PRÉSENTE');
        } else {
            console.log('❌ Section de connexion: MANQUANTE');
        }
        
        // Vérifier la section admin-dashboard
        if (html.includes('id="admin-dashboard"')) {
            console.log('✅ Section admin-dashboard: PRÉSENTE');
        } else {
            console.log('❌ Section admin-dashboard: MANQUANTE');
        }
        
        // Vérifier la section de synchronisation
        if (html.includes('Synchronisation KoboCollect')) {
            console.log('✅ Section synchronisation: PRÉSENTE');
        } else {
            console.log('❌ Section synchronisation: MANQUANTE');
        }
        
        // Vérifier le footer
        if (html.includes('<footer')) {
            console.log('✅ Footer: PRÉSENT');
        } else {
            console.log('❌ Footer: MANQUANT');
        }
        
        // Vérifier les boutons de synchronisation
        const syncButtons = (html.match(/id="sync-/g) || []).length;
        console.log(`✅ Boutons de synchronisation: ${syncButtons} trouvés`);
        
        // Vérifier la position du footer
        const footerIndex = html.indexOf('<footer');
        const lastSectionIndex = html.lastIndexOf('</section>');
        
        if (footerIndex > lastSectionIndex) {
            console.log('✅ Footer: BIEN POSITIONNÉ après les sections');
        } else {
            console.log('❌ Footer: MAL POSITIONNÉ');
        }
        
        console.log('\n🎯 Test terminé !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testAdminSimple();
