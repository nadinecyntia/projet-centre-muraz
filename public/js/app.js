// Application principale Centre MURAZ
class MurazApp {
    constructor() {
        this.user = null;
        this.currentPage = window.location.pathname;
        console.log('🔧 MurazApp initialisée sur la page:', this.currentPage);
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation de l\'application Centre MURAZ...');
        
        // Vérifier l'authentification
        await this.checkAuthentication();
        
        // Initialiser la navigation
        this.initNavigation();
        
        // Initialiser les fonctionnalités spécifiques à la page
        this.initPageFeatures();
        
        // Initialiser les gestionnaires d'événements globaux
        this.initGlobalEventListeners();
    }

    async checkAuthentication() {
        try {
            console.log('🔍 Vérification de l\'authentification...');
            const response = await fetch('/api/auth/check');
            const result = await response.json();
            
            console.log('📡 Réponse auth:', result);
            
            if (result.success && result.authenticated) {
                this.user = result.user;
                console.log('✅ Utilisateur connecté:', this.user.username, '(', this.user.role, ')');
            } else {
                console.log('ℹ️ Utilisateur non connecté');
                // Rediriger vers login si pas sur la page login
                if (this.currentPage !== '/login') {
                    window.location.href = '/login';
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Erreur vérification authentification:', error);
            if (this.currentPage !== '/login') {
                window.location.href = '/login';
            }
        }
    }

    initNavigation() {
        console.log('🧭 Initialisation de la navigation...');
        const nav = document.getElementById('main-nav');
        if (!nav) {
            console.error('❌ Élément main-nav non trouvé!');
            return;
        }

        console.log('📋 Génération des éléments de navigation...');
        const navItems = this.generateNavigationItems();
        console.log('🎯 Éléments de navigation générés:', navItems);
        
        nav.innerHTML = navItems;
        
        // Ajouter les gestionnaires d'événements de navigation
        this.setupNavigationEventListeners();
    }

    generateNavigationItems() {
        console.log('👤 Génération navigation pour utilisateur:', this.user);
        
        if (!this.user) {
            console.log('❌ Aucun utilisateur connecté');
            return '';
        }

        const isSuperAdmin = this.user.role === 'SUPER_ADMIN';
        const isViewer = this.user.role === 'VIEWER';

        console.log('🎭 Rôle utilisateur:', this.user.role, 'SuperAdmin:', isSuperAdmin, 'Viewer:', isViewer);

        let navItems = '';

        if (isSuperAdmin) {
            // Navigation complète pour SUPER_ADMIN
            navItems = `
                <a href="/" class="nav-item ${this.currentPage === '/' ? 'active' : ''}">
                    <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                </a>
                <a href="/admin" class="nav-item ${this.currentPage === '/admin' ? 'active' : ''}">
                    <i class="fas fa-cogs mr-2"></i>Administration
                </a>
                <a href="/analyses" class="nav-item ${this.currentPage === '/analyses' ? 'active' : ''}">
                    <i class="fas fa-chart-line mr-2"></i>Analyses
                </a>
                <a href="/indices" class="nav-item ${this.currentPage === '/indices' ? 'active' : ''}">
                    <i class="fas fa-chart-bar mr-2"></i>Indices
                </a>
                <a href="/biologie-moleculaire" class="nav-item ${this.currentPage === '/biologie-moleculaire' ? 'active' : ''}">
                    <i class="fas fa-dna mr-2"></i>Biologie Moléculaire
                </a>
            `;
        } else if (isViewer) {
            // Navigation limitée pour VIEWER
            navItems = `
                <a href="/analyses" class="nav-item ${this.currentPage === '/analyses' ? 'active' : ''}">
                    <i class="fas fa-chart-line mr-2"></i>Analyses
                </a>
                <a href="/indices" class="nav-item ${this.currentPage === '/indices' ? 'active' : ''}">
                    <i class="fas fa-chart-bar mr-2"></i>Indices
                </a>
            `;
        }

        // Ajouter le menu utilisateur et déconnexion
        if (this.user) {
            navItems += `
                <div class="flex items-center space-x-4 ml-auto">
                    <div class="relative group">
                        <button class="flex items-center space-x-2 text-gray-700 hover:text-muraz-blue transition-colors">
                            <i class="fas fa-user-circle text-xl"></i>
                            <span class="font-medium">${this.user.username}</span>
                            <span class="text-xs bg-gray-200 px-2 py-1 rounded">${this.user.role}</span>
                            <i class="fas fa-chevron-down text-xs"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
                            <div class="px-4 py-2 text-sm text-gray-700 border-b">
                                <div class="font-medium">${this.user.username}</div>
                                <div class="text-gray-500">${this.user.email}</div>
                            </div>
                            <button id="logoutBtn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                <i class="fas fa-sign-out-alt mr-2"></i>Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        console.log('✅ Navigation générée avec succès');
        return navItems;
    }

    setupNavigationEventListeners() {
        console.log('🎧 Configuration des événements de navigation...');
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            console.log('✅ Bouton déconnexion configuré');
        } else {
            console.log('⚠️ Bouton déconnexion non trouvé');
        }
    }

    async handleLogout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                this.user = null;
                window.location.href = '/login';
            } else {
                console.error('Erreur lors de la déconnexion');
                this.showNotification('❌ Erreur lors de la déconnexion', 'error');
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            this.showNotification('❌ Erreur de connexion', 'error');
        }
    }

    initPageFeatures() {
        // Initialiser les fonctionnalités spécifiques selon la page
        switch (this.currentPage) {
            case '/admin':
                this.initAdminPage();
                break;
            case '/analyses':
                this.initAnalysesPage();
                break;
            case '/indices':
                this.initIndicesPage();
                break;
            case '/biologie-moleculaire':
                this.initBiologiePage();
                break;
            case '/':
                this.initDashboardPage();
                break;
        }
    }

    initAdminPage() {
        console.log('🔧 Initialisation page Admin...');
        // Les fonctionnalités Admin sont gérées par admin.js
    }

    initAnalysesPage() {
        console.log('📊 Initialisation page Analyses...');
        // Les fonctionnalités Analyses sont gérées par analyses.js
    }

    initIndicesPage() {
        console.log('📈 Initialisation page Indices...');
        // Les fonctionnalités Indices sont gérées par indices.js
    }

    initBiologiePage() {
        console.log('🧬 Initialisation page Biologie...');
        // Les fonctionnalités Biologie sont gérées par biologie.js
    }

    initDashboardPage() {
        console.log('🏠 Initialisation page Dashboard...');
        // Les fonctionnalités Dashboard sont gérées par dashboard.js
    }

    initGlobalEventListeners() {
        // Gestionnaire global pour les notifications
        window.showNotification = this.showNotification.bind(this);
        
        // Gestionnaire global pour les erreurs
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
            this.showNotification('❌ Une erreur est survenue', 'error');
        });
    }

    showNotification(message, type = 'info', duration = 5000) {
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm transform transition-all duration-300 translate-x-full`;
        
        const bgColor = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        }[type] || 'bg-blue-500';
        
        notification.className += ` ${bgColor} text-white`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-suppression
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    // Méthode pour rafraîchir les données
    async refreshData() {
        try {
            // Rafraîchir les données selon la page actuelle
            switch (this.currentPage) {
                case '/analyses':
                    if (window.loadAnalysesData) {
                        await window.loadAnalysesData();
                    }
                    break;
                case '/indices':
                    if (window.loadIndicesData) {
                        await window.loadIndicesData();
                    }
                    break;
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement:', error);
            this.showNotification('❌ Erreur lors du rafraîchissement', 'error');
        }
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, initialisation de MurazApp...');
    window.murazApp = new MurazApp();
});
