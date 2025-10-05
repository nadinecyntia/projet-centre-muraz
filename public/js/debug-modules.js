// Script de debug pour vérifier le chargement des modules
console.log('🔍 DEBUG MODULES CHARGEMENT');

// Vérifier que les modules de navigation sont disponibles
setTimeout(() => {
    console.log('📋 Vérification des modules de navigation...');
    
    // Vérifier l'utilisateur connecté
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            console.log('👤 Utilisateur:', data.user);
            console.log('👤 Rôle:', data.user ? data.user.role : 'GUEST');
            
            // Vérifier la navigation générée
            const nav = document.getElementById('main-nav');
            if (nav) {
                console.log('🧭 Navigation trouvée:', nav);
                console.log('🧭 Contenu HTML:', nav.innerHTML);
                console.log('🧭 Nombre d\'éléments:', nav.children.length);
                
                // Vérifier le bouton de déconnexion
                const logoutBtn = document.getElementById('logout-btn');
                console.log('🚪 Bouton de déconnexion:', logoutBtn ? 'Présent' : 'Absent');
                
                // Vérifier le sélecteur de langue
                const langSelector = document.getElementById('muraz-language-selector');
                console.log('🌍 Sélecteur de langue:', langSelector ? 'Présent' : 'Absent');
            } else {
                console.error('❌ Navigation non trouvée!');
            }
        })
        .catch(error => {
            console.error('❌ Erreur vérification auth:', error);
        });
}, 2000);

// Exposer la fonction globalement pour test manuel
window.debugModules = function() {
    console.log('🧪 TEST MANUEL MODULES');
    console.log('Navigation:', document.getElementById('main-nav'));
    console.log('Logout:', document.getElementById('logout-btn'));
    console.log('Lang:', document.getElementById('muraz-language-selector'));
};
