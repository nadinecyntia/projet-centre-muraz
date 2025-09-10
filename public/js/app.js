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

               // Démarrer la vérification périodique de session
               this.startSessionCheck();
               
               // Écouter les changements de langue
               this.setupLanguageChangeListener();
    }

               async checkAuthentication() {
               try {
                   console.log('🔍 Vérification de l\'authentification...');
                   const response = await fetch('/api/auth/check');
                   
                   if (!response.ok) {
                       throw new Error(`HTTP ${response.status}`);
                   }
                   
                   const result = await response.json();
                   console.log('📡 Réponse auth:', result);

                   if (result.success && result.authenticated) {
                       this.user = result.user;
                       console.log('✅ Utilisateur connecté:', this.user.username, '(', this.user.role, ')');
                       
                       // Vérifier les permissions pour la page actuelle
                       this.checkPagePermissions();
                   } else {
                       console.log('ℹ️ Utilisateur non connecté');
                       // Ne pas rediriger si on est sur la page d'accueil ou login
                       if (this.currentPage !== '/login' && this.currentPage !== '/') {
                           console.log('🚫 Accès refusé, redirection vers login');
                           window.location.href = '/login';
                           return;
                       }
                   }
               } catch (error) {
                   console.error('❌ Erreur vérification authentification:', error);
                   if (this.currentPage !== '/login' && this.currentPage !== '/') {
                       console.log('🚫 Erreur de connexion, redirection vers login');
                       window.location.href = '/login';
                   }
               }
           }

           checkPagePermissions() {
               // Vérifier les permissions selon la page et le rôle
               if (this.currentPage === '/admin' && this.user.role !== 'SUPER_ADMIN') {
                   console.log('🚫 Accès refusé à /admin - rôle insuffisant');
                   window.location.href = '/login';
                   return;
               }
               
               if (this.currentPage === '/biologie-moleculaire' && this.user.role !== 'SUPER_ADMIN') {
                   console.log('🚫 Accès refusé à /biologie-moleculaire - rôle insuffisant');
                   window.location.href = '/login';
                   return;
               }
               
               if ((this.currentPage === '/analyses' || this.currentPage === '/indices') && 
                   !['SUPER_ADMIN', 'VIEWER'].includes(this.user.role)) {
                   console.log('🚫 Accès refusé aux analyses/indices - rôle insuffisant');
                   window.location.href = '/login';
                   return;
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
        console.log('🎯 Longueur des éléments:', navItems.length);
        
        nav.innerHTML = navItems;
        
        // Ajouter les gestionnaires d'événements de navigation
        this.setupNavigationEventListeners();
        
        // Debug: vérifier le contenu final
        console.log('🔍 Contenu final de main-nav:', nav.innerHTML);
    }

    generateNavigationItems() {
        console.log('👤 Génération navigation pour utilisateur:', this.user);
        
        if (!this.user) {
            console.log('❌ Aucun utilisateur connecté');
            // Retourner une navbar statique pour les utilisateurs non connectés
            return `
                <a href="/" class="text-muraz-blue font-semibold" data-i18n="navigation.home">Accueil</a>
                <a href="/login" class="text-gray-700 hover:text-muraz-blue transition-colors" data-i18n="navigation.login">Connexion</a>
                <div id="languageSelector" class="language-selector ml-auto"></div>
            `;
        }

        // Si on est sur la page d'accueil et qu'un utilisateur est connecté, générer la navigation dynamique
        if (this.currentPage === '/') {
            console.log('🏠 Page d\'accueil - utilisateur connecté - génération navigation dynamique');
        }

        const isSuperAdmin = this.user.role === 'SUPER_ADMIN';
        const isViewer = this.user.role === 'VIEWER';

        console.log('🎭 Rôle utilisateur:', this.user.role, 'SuperAdmin:', isSuperAdmin, 'Viewer:', isViewer);

        let navItems = '';

        if (isSuperAdmin) {
            // Navigation complète pour SUPER_ADMIN
            navItems = `
                <a href="/" class="nav-item ${this.currentPage === '/' ? 'active' : ''}">
                    <i class="fas fa-home mr-2"></i><span data-i18n="navigation.home">Accueil</span>
                </a>
                <a href="/analyses" class="nav-item ${this.currentPage === '/analyses' ? 'active' : ''}">
                    <i class="fas fa-chart-line mr-2"></i><span data-i18n="navigation.analyses">Analyses</span>
                </a>
                <a href="/indices" class="nav-item ${this.currentPage === '/indices' ? 'active' : ''}">
                    <i class="fas fa-chart-bar mr-2"></i><span data-i18n="navigation.indices">Indices</span>
                </a>
                <a href="/biologie-moleculaire" class="nav-item ${this.currentPage === '/biologie-moleculaire' ? 'active' : ''}">
                    <i class="fas fa-dna mr-2"></i><span data-i18n="navigation.molecular_biology">Biologie Moléculaire</span>
                </a>
            `;
        } else if (isViewer) {
            // Navigation limitée pour VIEWER
            navItems = `
                <a href="/" class="nav-item ${this.currentPage === '/' ? 'active' : ''}">
                    <i class="fas fa-home mr-2"></i><span data-i18n="navigation.home">Accueil</span>
                </a>
                <a href="/analyses" class="nav-item ${this.currentPage === '/analyses' ? 'active' : ''}">
                    <i class="fas fa-chart-line mr-2"></i><span data-i18n="navigation.analyses">Analyses</span>
                </a>
                <a href="/indices" class="nav-item ${this.currentPage === '/indices' ? 'active' : ''}">
                    <i class="fas fa-chart-bar mr-2"></i><span data-i18n="navigation.indices">Indices</span>
                </a>
            `;
        }

        // Ajouter le menu utilisateur et le sélecteur de langue
        navItems += `
            <div class="flex items-center space-x-4 ml-auto">
                <div class="flex items-center space-x-3">
                    <span class="font-medium text-gray-700">${this.user.username}</span>
                    <span class="text-xs bg-gray-200 px-2 py-1 rounded">${this.user.role}</span>
                    <button id="logoutBtn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-md">
                        <i class="fas fa-sign-out-alt"></i>
                        <span data-i18n="navigation.logout">Déconnexion</span>
                    </button>
                </div>
                <div id="languageSelector" class="language-selector"></div>
            </div>
        `;

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
        
        // Initialiser le sélecteur de langue
        this.initLanguageSelector();
    }

    initLanguageSelector() {
        const languageSelector = document.getElementById('languageSelector');
        if (!languageSelector) {
            console.warn('⚠️ Élément languageSelector non trouvé');
            return;
        }

        if (!window.translationManager) {
            console.warn('⚠️ TranslationManager non disponible');
            return;
        }

        try {
            // Vider le conteneur existant
            languageSelector.innerHTML = '';
            
            // Créer le sélecteur
            const selector = window.translationManager.createLanguageSelector();
            languageSelector.appendChild(selector);
            
            // Ajouter un écouteur d'événement sur le select
            const selectElement = selector.querySelector('select');
            if (selectElement) {
                selectElement.addEventListener('change', async (e) => {
                    const newLanguage = e.target.value;
                    console.log('🔄 Changement de langue via sélecteur:', newLanguage);
                    
                    try {
                        await window.translationManager.changeLanguage(newLanguage);
                        console.log('✅ Changement de langue réussi via sélecteur');
                    } catch (error) {
                        console.error('❌ Erreur lors du changement de langue:', error);
                    }
                });
                
                console.log('✅ Sélecteur de langue initialisé avec écouteur');
            } else {
                console.error('❌ Élément select non trouvé dans le sélecteur');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du sélecteur de langue:', error);
        }
    }

    setupLanguageChangeListener() {
        window.addEventListener('languageChanged', (event) => {
            console.log('🌐 Langue changée:', event.detail.language);
            // Recharger la navigation pour appliquer les nouvelles traductions
            this.initNavigation();
        });
    }

    async handleLogout() {
        try {
            console.log('🔐 Déconnexion en cours...');
            
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                console.log('✅ Déconnexion réussie');
                this.user = null;
                
                // Nettoyer les données locales
                localStorage.removeItem('user');
                sessionStorage.clear();
                
                // Rediriger vers la page de connexion
                window.location.href = '/login';
            } else {
                console.error('❌ Erreur lors de la déconnexion');
                this.showNotification('❌ Erreur lors de la déconnexion', 'error');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error);
            this.showNotification('❌ Erreur de connexion', 'error');
        }
    }

    // Vérification périodique de la session
    startSessionCheck() {
        setInterval(async () => {
            try {
                const response = await fetch('/api/auth/check');
                const result = await response.json();
                
                if (!result.success || !result.authenticated) {
                    console.log('⚠️ Session expirée, redirection vers login');
                    this.user = null;
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('❌ Erreur vérification session:', error);
            }
        }, 30000); // Vérifier toutes les 30 secondes
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
