// Application principale Centre MURAZ
// Import du gestionnaire de navigation modulaire
import { navigationManager } from './navigation/navigation-manager.js';

class MurazApp {
    constructor() {
        this.user = null;
        this.currentPage = window.location.pathname;
        console.log('🔧 MurazApp initialisée sur la page:', this.currentPage);
        console.log('🔧 DOM prêt:', document.readyState);
        
        // Attendre que le DOM soit complètement chargé
        if (document.readyState === 'loading') {
            console.log('⏳ Attente du chargement du DOM...');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('✅ DOM chargé, initialisation...');
                this.init();
            });
        } else {
            console.log('✅ DOM déjà chargé, initialisation immédiate...');
            this.init();
        }
    }

    async init() {
        console.log('🚀 Initialisation de l\'application Centre MURAZ...');
        
        // Vérifier l'authentification
        console.log('🔍 Début de la vérification d\'authentification...');
        await this.checkAuthentication();
        console.log('✅ Vérification d\'authentification terminée. User:', this.user);
        
        // Attendre que le système de traduction soit prêt
        await this.waitForI18nSystem();
        
        // Initialiser la navigation
        console.log('🧭 Début de l\'initialisation de la navigation...');
        this.initNavigation();
        console.log('✅ Initialisation de la navigation terminée');
        
        // Initialiser les fonctionnalités spécifiques à la page
        this.initPageFeatures();
        
                       // Initialiser les gestionnaires d'événements globaux
               this.initGlobalEventListeners();

               // Démarrer la vérification périodique de session
               this.startSessionCheck();
               
               // Fonctionnalités de langue supprimées
    }

    /**
     * Attend que le système de traduction soit initialisé
     */
    async waitForI18nSystem() {
        console.log('🌍 Attente du système de traduction...');
        
        // Attendre que le système soit disponible
        let attempts = 0;
        const maxAttempts = 50; // 5 secondes max
        
        while (attempts < maxAttempts) {
            if (window.murazI18n && window.murazI18n.isInitialized()) {
                console.log('✅ Système de traduction prêt');
                return;
            }
            
            // Attendre 100ms avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        console.warn('⚠️ Système de traduction non disponible après 5 secondes, continuation sans traduction');
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
                   
                   // Vérifier que la réponse est valide
                   if (!result || typeof result !== 'object') {
                       throw new Error('Réponse invalide du serveur');
                   }

                   if (result.success && result.authenticated) {
                       this.user = result.user;
                       console.log('✅ Utilisateur connecté:', this.user.username, '(', this.user.role, ')');
                       
                       // Vérifier les permissions pour la page actuelle
                       this.checkPagePermissions();
                   } else {
                       console.log('ℹ️ Utilisateur non connecté');
                       this.user = null; // S'assurer que user est null
                       // Ne pas rediriger si on est sur la page d'accueil ou login
                       if (this.currentPage !== '/login' && this.currentPage !== '/') {
                           console.log('🚫 Accès refusé, redirection vers login');
                           window.location.href = '/login';
                           return;
                       }
                   }
               } catch (error) {
                   console.error('❌ Erreur vérification authentification:', error);
                   // En cas d'erreur, traiter comme non connecté
                   this.user = null;
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
               
               if (this.currentPage === '/collect' && 
                   !['SUPER_ADMIN', 'INVESTIGATOR'].includes(this.user.role)) {
                   console.log('🚫 Accès refusé à /collect - rôle insuffisant');
                   window.location.href = '/login';
                   return;
               }
           }

    initNavigation() {
        console.log('🧭 Initialisation de la navigation...');
        console.log('👤 Utilisateur actuel:', this.user);
        console.log('📍 Page actuelle:', this.currentPage);
        
        const nav = document.getElementById('main-nav');
        const rightTools = document.getElementById('nav-right-tools');
        if (!nav) {
            console.error('❌ Élément main-nav non trouvé!');
            return;
        }

        console.log('📋 Génération des éléments de navigation...');
        const navItems = this.generateNavigationItems();
        console.log('🎯 Éléments de navigation générés:', navItems);
        console.log('🎯 Longueur des éléments:', navItems.length);
        
        // Sauvegarder le sélecteur de langue s'il existe
        const languageSelector = document.getElementById('muraz-language-selector');
        
        // Si utilisateur non connecté, on pousse la nav à droite et on cache les outils de droite
        if (!this.user) {
            nav.classList.add('ml-auto');
            if (rightTools) rightTools.style.display = 'none';
        } else {
            nav.classList.remove('ml-auto');
            if (rightTools) rightTools.style.display = '';
        }
        
        nav.innerHTML = navItems;
        
        // Restaurer le sélecteur de langue s'il existait
        if (languageSelector) {
            nav.appendChild(languageSelector);
            console.log('✅ Sélecteur de langue restauré');
        }
        
        console.log('✅ Navigation mise à jour dans le DOM');
        
        // Ajouter les gestionnaires d'événements de navigation
        this.setupNavigationEventListeners();
        
        // Initialiser le sélecteur de langue après la navigation
        this.ensureLanguageSelector();
        setTimeout(() => {
        }, 100);
        
        // Debug: vérifier le contenu final
        console.log('🔍 Contenu final de main-nav:', nav.innerHTML);
    }

    /**
     * S'assure que le sélecteur de langue est présent
     */
    ensureLanguageSelector() {
        // Attendre un peu pour que le système de traduction soit prêt
        setTimeout(() => {
            if (window.murazI18n && !document.getElementById('muraz-language-selector')) {
                console.log('🔧 Sélecteur de langue manquant, tentative de création...');
                window.murazI18n.setupLanguageSelector();
            }
        }, 100);
    }

    /**
     * Obtient une traduction de manière sécurisée
     */
    getTranslation(key, fallback) {
        if (window.murazI18n && window.murazI18n.isInitialized()) {
            return window.murazI18n.t(key, fallback);
        }
        return fallback;
    }

    generateNavigationItems() {
        console.log('👤 Génération navigation pour utilisateur:', this.user);
        
        if (!this.user) {
            console.log('❌ Aucun utilisateur connecté - navigation limitée');
            // Retourner une navbar statique pour les utilisateurs non connectés (alignée à l'extrême droite)
            const homeText = this.getTranslation('navigation.home', 'Accueil');
            const loginText = this.getTranslation('navigation.login', 'Connexion');
            
            return `
                <div class="ml-auto flex items-center space-x-6">
                    <a href="/" class="nav-item ${this.currentPage === '/' ? 'active' : ''}">
                        <i class="fas fa-home mr-2"></i><span>${homeText}</span>
                    </a>
                    <a href="/login" class="nav-item ${this.currentPage === '/login' ? 'active' : ''}">
                        <i class="fas fa-sign-in-alt mr-2"></i><span>${loginText}</span>
                    </a>
                </div>
            `;
        }

        // Si on est sur la page d'accueil et qu'un utilisateur est connecté, générer la navigation dynamique
        if (this.currentPage === '/') {
            console.log('🏠 Page d\'accueil - utilisateur connecté - génération navigation dynamique');
        }

        const isSuperAdmin = this.user.role === 'SUPER_ADMIN';
        const isViewer = this.user.role === 'VIEWER';
        const isInvestigator = this.user.role === 'INVESTIGATOR';

        console.log('🎭 Rôle utilisateur:', this.user.role, 'SuperAdmin:', isSuperAdmin, 'Viewer:', isViewer);

        let navItems = '';

        if (isSuperAdmin) {
            // Navigation complète pour SUPER_ADMIN
            navItems = `
                <a href="/" class="nav-item ${this.currentPage === '/' ? 'active' : ''}">
                    <i class="fas fa-home mr-2"></i><span >Accueil</span>
                </a>
                <a href="/analyses" class="nav-item ${this.currentPage === '/analyses' ? 'active' : ''}">
                    <i class="fas fa-chart-line mr-2"></i><span >Analyses</span>
                </a>
                <a href="/indices" class="nav-item ${this.currentPage === '/indices' ? 'active' : ''}">
                    <i class="fas fa-chart-bar mr-2"></i><span >Indices</span>
                </a>
                <a href="/biologie-moleculaire" class="nav-item ${this.currentPage === '/biologie-moleculaire' ? 'active' : ''}">
                    <i class="fas fa-dna mr-2"></i><span >Biologie Moléculaire</span>
                </a>
                <a href="/admin" class="nav-item nav-admin ${this.currentPage === '/admin' ? 'active' : ''}">
                    <i class="fas fa-cog mr-2"></i><span >Admin</span>
                </a>
                <a href="/admin/users" class="nav-item ${this.currentPage === '/admin/users' ? 'active' : ''}">
                    <i class="fas fa-users-cog mr-2"></i><span>Utilisateurs</span>
                </a>
            `;
        } else if (isViewer) {
            // Navigation limitée pour VIEWER
            navItems = `
                <a href="/" class="nav-item ${this.currentPage === '/' ? 'active' : ''}">
                    <i class="fas fa-home mr-2"></i><span >Accueil</span>
                </a>
                <a href="/analyses" class="nav-item ${this.currentPage === '/analyses' ? 'active' : ''}">
                    <i class="fas fa-chart-line mr-2"></i><span >Analyses</span>
                </a>
                <a href="/indices" class="nav-item ${this.currentPage === '/indices' ? 'active' : ''}">
                    <i class="fas fa-chart-bar mr-2"></i><span >Indices</span>
                </a>
            `;
        } else if (isInvestigator) {
            // Navigation pour INVESTIGATOR: Accueil + Collecte
            navItems = `
                <a href="/" class="nav-item ${this.currentPage === '/' ? 'active' : ''}">
                    <i class="fas fa-home mr-2"></i><span >Accueil</span>
                </a>
                <a href="/collect" class="nav-item ${this.currentPage === '/collect' ? 'active' : ''}">
                    <i class="fas fa-clipboard-list mr-2"></i><span>Collecte</span>
                </a>
            `;
        }

        // Ajouter le menu utilisateur compact + sélecteur de langue
        const initials = (this.user.username || '?')
            .split(/\s+/)
            .map(s => s[0])
            .join('')
            .slice(0,2)
            .toUpperCase();

        navItems += `
            <div class="ml-auto flex items-center space-x-3">
                <!-- Informations utilisateur (desktop) -->
                <div class="hidden md:flex items-center space-x-3 text-sm text-gray-600">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs">
                            ${initials}
                        </div>
                        <div>
                            <div class="font-medium text-gray-800">${this.user.username}</div>
                            <div class="text-xs text-gray-500">${this.user.role}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Bouton de déconnexion visible (desktop) -->
                <button id="logoutBtn" class="hidden md:flex bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium items-center gap-2 transition-colors">
                    <i class="fas fa-sign-out-alt"></i>
                    <span >Déconnexion</span>
                </button>
                
                <!-- Menu utilisateur mobile -->
                <div class="md:hidden relative" id="userMenu">
                    <button id="userMenuBtn" class="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold" title="${this.user.username} (${this.user.role})">
                        ${initials}
                    </button>
                    <div id="userDropdown" class="hidden absolute right-0 mt-2 w-44 card p-2 z-50">
                        <div class="px-2 py-1 text-sm text-gray-600 truncate" title="${this.user.username} (${this.user.role})">${this.user.username} (${this.user.role})</div>
                        <button id="logoutBtnMobile" class="mt-2 w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm flex items-center justify-center gap-2">
                            <i class="fas fa-sign-out-alt"></i>
                            <span >Déconnexion</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        console.log('✅ Navigation générée avec succès');
        return navItems;
    }

    setupNavigationEventListeners() {
        console.log('🎧 Configuration des événements de navigation...');
        
        // Bouton de déconnexion desktop
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            console.log('✅ Bouton déconnexion desktop configuré');
        } else {
            console.log('⚠️ Bouton déconnexion desktop non trouvé');
        }
        
        // Bouton de déconnexion mobile
        const logoutBtnMobile = document.getElementById('logoutBtnMobile');
        if (logoutBtnMobile) {
            logoutBtnMobile.addEventListener('click', this.handleLogout.bind(this));
            console.log('✅ Bouton déconnexion mobile configuré');
        } else {
            console.log('⚠️ Bouton déconnexion mobile non trouvé');
        }

        // Menu utilisateur (dropdown)
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!userDropdown.classList.contains('hidden')) {
                    const menu = document.getElementById('userMenu');
                    if (menu && !menu.contains(e.target)) {
                        userDropdown.classList.add('hidden');
                    }
                }
            });
        }
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
        // Les fonctionnalités Dashboard ont été supprimées
        
        // S'assurer que le sélecteur de langue est initialisé
        setTimeout(() => {
        }, 200);
    }

    initGlobalEventListeners() {
        // Gestionnaire global pour les notifications
        window.showNotification = this.showNotification.bind(this);
        
        // Écouteur pour les changements de langue
        window.addEventListener('murazI18nLanguageChanged', () => {
            console.log('🌍 Changement de langue détecté, mise à jour de la navigation');
            // Attendre un peu pour que les traductions soient chargées
            setTimeout(() => {
                this.initNavigation();
            }, 100);
        });
        
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
console.log('📝 Script app.js chargé');
console.log('📝 État du DOM:', document.readyState);

// Initialiser l'application immédiatement
console.log('📄 Initialisation de MurazApp...');
window.murazApp = new MurazApp();
