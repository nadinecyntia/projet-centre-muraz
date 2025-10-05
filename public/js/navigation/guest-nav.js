// =====================================================
// MODULE NAVIGATION GUEST (Utilisateurs non connectés)
// =====================================================

/**
 * Génère la navigation pour les utilisateurs non connectés
 * @param {string} currentPage - Page actuelle
 * @param {Function} getTranslation - Fonction de traduction
 * @returns {string} HTML de la navigation
 */
export function generateGuestNavigation(currentPage, getTranslation) {
    console.log('👤 Génération navigation GUEST');
    
    const homeText = getTranslation('navigation.home', 'Accueil');
    const loginText = getTranslation('navigation.login', 'Connexion');
    
    return `
        <a href="/" class="nav-item ${currentPage === '/' ? 'active' : ''}">
            <i class="fas fa-home mr-2"></i><span>${homeText}</span>
        </a>
        <a href="/login" class="nav-item ${currentPage === '/login' ? 'active' : ''}">
            <i class="fas fa-sign-in-alt mr-2"></i><span>${loginText}</span>
        </a>
    `;
}

export default generateGuestNavigation;
