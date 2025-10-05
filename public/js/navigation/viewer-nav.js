// =====================================================
// MODULE NAVIGATION VIEWER
// =====================================================

/**
 * Génère la navigation pour les VIEWER
 * @param {string} currentPage - Page actuelle
 * @param {Function} getTranslation - Fonction de traduction
 * @returns {string} HTML de la navigation
 */
export function generateViewerNavigation(currentPage, getTranslation) {
    console.log('👤 Génération navigation VIEWER');
    
    const homeText = getTranslation('navigation.home', 'Accueil');
    const analysesText = getTranslation('navigation.analyses', 'Analyses');
    const indicesText = getTranslation('navigation.indices', 'Indices');
    const logoutText = getTranslation('navigation.logout', 'Déconnexion');
    
    return `
        <a href="/" class="nav-item ${currentPage === '/' ? 'active' : ''}">
            <i class="fas fa-home mr-2"></i><span>${homeText}</span>
        </a>
        <a href="/analyses" class="nav-item ${currentPage === '/analyses' ? 'active' : ''}">
            <i class="fas fa-chart-line mr-2"></i><span>${analysesText}</span>
        </a>
        <a href="/indices" class="nav-item ${currentPage === '/indices' ? 'active' : ''}">
            <i class="fas fa-chart-bar mr-2"></i><span>${indicesText}</span>
        </a>
        <div class="nav-separator"></div>
        <button id="logout-btn" class="nav-item nav-logout" onclick="logout()">
            <i class="fas fa-sign-out-alt mr-2"></i><span>${logoutText}</span>
        </button>
    `;
}

export default generateViewerNavigation;
