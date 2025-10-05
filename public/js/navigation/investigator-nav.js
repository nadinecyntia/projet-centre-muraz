// =====================================================
// MODULE NAVIGATION INVESTIGATOR
// =====================================================

/**
 * Génère la navigation pour les INVESTIGATOR
 * @param {string} currentPage - Page actuelle
 * @param {Function} getTranslation - Fonction de traduction
 * @returns {string} HTML de la navigation
 */
export function generateInvestigatorNavigation(currentPage, getTranslation) {
    console.log('👤 Génération navigation INVESTIGATOR');
    
    const homeText = getTranslation('navigation.home', 'Accueil');
    const collectText = getTranslation('navigation.collect', 'Collecte');
    const logoutText = getTranslation('navigation.logout', 'Déconnexion');
    
    return `
        <a href="/" class="nav-item ${currentPage === '/' ? 'active' : ''}">
            <i class="fas fa-home mr-2"></i><span>${homeText}</span>
        </a>
        <a href="/collect" class="nav-item ${currentPage === '/collect' ? 'active' : ''}">
            <i class="fas fa-clipboard-list mr-2"></i><span>${collectText}</span>
        </a>
        <div class="nav-separator"></div>
        <button id="logout-btn" class="nav-item nav-logout" onclick="logout()">
            <i class="fas fa-sign-out-alt mr-2"></i><span>${logoutText}</span>
        </button>
    `;
}

export default generateInvestigatorNavigation;
