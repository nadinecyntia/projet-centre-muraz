// Navigation adaptative selon le rôle utilisateur
class Navigation {
    constructor() {
        this.user = null;
        this.init();
    }

    async init() {
        await this.loadUserInfo();
        this.renderNavigation();
        this.setupEventListeners();
    }

    async loadUserInfo() {
        try {
            const response = await fetch('/api/user-info');
            if (response.ok) {
                this.user = await response.json();
            }
        } catch (error) {
            console.log('Utilisateur non connecté');
        }
    }

    renderNavigation() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;

        const isSuperAdmin = this.user?.role === 'SUPER_ADMIN';
        const isViewer = this.user?.role === 'VIEWER';

        let navItems = '';

        if (isSuperAdmin) {
            // Navigation complète pour SUPER_ADMIN
            navItems = `
                <a href="/" class="nav-item">
                    <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                </a>
                <a href="/admin" class="nav-item">
                    <i class="fas fa-cogs mr-2"></i>Administration
                </a>
                <a href="/analyses" class="nav-item">
                    <i class="fas fa-chart-line mr-2"></i>Analyses
                </a>
                <a href="/indices" class="nav-item">
                    <i class="fas fa-chart-bar mr-2"></i>Indices
                </a>
                <a href="/biologie-moleculaire" class="nav-item">
                    <i class="fas fa-dna mr-2"></i>Biologie Moléculaire
                </a>
            `;
        } else if (isViewer) {
            // Navigation limitée pour VIEWER
            navItems = `
                <a href="/analyses" class="nav-item">
                    <i class="fas fa-chart-line mr-2"></i>Analyses
                </a>
                <a href="/indices" class="nav-item">
                    <i class="fas fa-chart-bar mr-2"></i>Indices
                </a>
            `;
        }

        // Ajouter le menu utilisateur et déconnexion
        if (this.user) {
            navItems += `
                <div class="flex items-center space-x-4 ml-auto">
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-user mr-1"></i>${this.user.username}
                        <span class="text-xs bg-gray-200 px-2 py-1 rounded ml-2">${this.user.role}</span>
                    </span>
                    <button id="logoutBtn" class="text-red-600 hover:text-red-800 transition-colors">
                        <i class="fas fa-sign-out-alt mr-1"></i>Déconnexion
                    </button>
                </div>
            `;
        }

        nav.innerHTML = navItems;
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    }

    async handleLogout() {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                window.location.href = '/login';
            } else {
                console.error('Erreur lors de la déconnexion');
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    }
}

// Initialiser la navigation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new Navigation();
});
