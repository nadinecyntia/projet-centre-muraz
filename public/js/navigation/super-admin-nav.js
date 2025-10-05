// =====================================================
// MODULE NAVIGATION SUPER_ADMIN
// =====================================================

/**
 * Génère la navigation pour les SUPER_ADMIN
 * @param {string} currentPage - Page actuelle
 * @param {Function} getTranslation - Fonction de traduction
 * @returns {string} HTML de la navigation
 */
export function generateSuperAdminNavigation(currentPage, getTranslation) {
    console.log('👤 Génération navigation SUPER_ADMIN');
    
    const homeText = getTranslation('navigation.home', 'Accueil');
    const analysesText = getTranslation('navigation.analyses', 'Analyses');
    const indicesText = getTranslation('navigation.indices', 'Indices');
    const biologieText = getTranslation('navigation.biologie', 'Biologie Moléculaire');
    const adminText = getTranslation('navigation.admin', 'Administration');
    const usersText = getTranslation('navigation.users', 'Utilisateurs');
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
        <a href="/biologie-moleculaire" class="nav-item ${currentPage === '/biologie-moleculaire' ? 'active' : ''}">
            <i class="fas fa-dna mr-2"></i><span>${biologieText}</span>
        </a>
        <a href="/admin" class="nav-item nav-admin ${currentPage === '/admin' ? 'active' : ''}">
            <i class="fas fa-cog mr-2"></i><span>${adminText}</span>
        </a>
        <a href="/admin/users" class="nav-item ${currentPage === '/admin/users' ? 'active' : ''}">
            <i class="fas fa-users-cog mr-2"></i><span>${usersText}</span>
        </a>
        <div class="nav-separator"></div>
        <button id="logout-btn" class="nav-item nav-logout" onclick="logout()">
            <i class="fas fa-sign-out-alt mr-2"></i><span>${logoutText}</span>
        </button>
    `;
}

export default generateSuperAdminNavigation;
