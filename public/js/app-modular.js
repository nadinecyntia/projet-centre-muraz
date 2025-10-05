// Application principale Centre MURAZ - Version Modulaire
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
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            this.init();
        }
    }

    async init() {
        console.log('🚀 Initialisation MurazApp...');
        
        // Attendre que le système de traduction soit prêt
        await this.waitForI18nSystem();
        
        await this.checkAuthentication();
        
        // Délai supplémentaire pour s'assurer que tout est prêt
        setTimeout(() => {
            this.initNavigation();
            this.setupEventListeners();
            this.checkPagePermissions();
            console.log('✅ MurazApp initialisée');
        }, 100);
    }

    async waitForI18nSystem() {
        console.log('🌍 Attente du système de traduction...');
        let attempts = 0;
        const maxAttempts = 20; // 2 secondes max seulement
        while (attempts < maxAttempts) {
            if (window.murazI18n && window.murazI18n.isInitialized()) {
                console.log('✅ Système de traduction prêt');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        console.log('ℹ️ Système de traduction non disponible, utilisation des traductions par défaut');
    }

    async checkAuthentication() {
        console.log('🔐 Vérification de l\'authentification...');
        try {
            const response = await fetch('/api/auth/check');
            const result = await response.json();
            
            if (result.success && result.authenticated) {
                this.user = result.user;
                console.log('✅ Utilisateur connecté:', this.user.username, 'Rôle:', this.user.role);
            } else {
                console.log('ℹ️ Utilisateur non connecté');
                this.user = null; // S'assurer que user est null
                
                // Rediriger vers login si nécessaire (sauf pour les pages publiques)
                const publicPages = ['/', '/login'];
                if (!publicPages.includes(this.currentPage)) {
                    console.log('🔄 Redirection vers login...');
                    window.location.href = '/login';
                    return;
                }
            }
        } catch (error) {
            console.error('❌ Erreur vérification authentification:', error);
            this.user = null; // En cas d'erreur, traiter comme non connecté
            
            // Rediriger vers login si nécessaire
            const publicPages = ['/', '/login'];
            if (!publicPages.includes(this.currentPage)) {
                console.log('🔄 Redirection vers login (erreur)...');
                window.location.href = '/login';
                return;
            }
        }
    }

    initNavigation() {
        console.log('🧭 Initialisation de la navigation...');
        console.log('📍 Page actuelle:', this.currentPage);
        
        const nav = document.getElementById('main-nav');
        const rightTools = document.getElementById('nav-right-tools');
        if (!nav) {
            console.error('❌ Élément main-nav non trouvé!');
            return;
        }

        // Appliquer le CSS AVANT de générer le contenu
        if (!this.user) {
            nav.classList.add('ml-auto');
            nav.style.marginLeft = 'auto'; // Force inline
            if (rightTools) rightTools.style.display = 'none';
        } else {
            nav.classList.remove('ml-auto');
            nav.style.marginLeft = '0'; // Reset inline
            if (rightTools) rightTools.style.display = '';
        }

        console.log('📋 Génération des éléments de navigation...');
        const navItems = this.generateNavigationItems();
        console.log('🎯 Éléments de navigation générés:', navItems);
        console.log('🎯 Longueur des éléments:', navItems.length);
        
        // Sauvegarder le sélecteur de langue s'il existe
        const languageSelector = document.getElementById('muraz-language-selector');
        
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
        
        // Ajouter la fonction logout globale
        window.logout = this.logout.bind(this);
    }

    generateNavigationItems() {
        console.log('👤 Génération navigation pour utilisateur:', this.user);
        console.log('👤 Rôle utilisateur:', this.user ? this.user.role : 'GUEST');
        console.log('👤 Page actuelle:', this.currentPage);
        
        // Utiliser le gestionnaire de navigation modulaire
        const navHTML = navigationManager.generateNavigation(this.user, this.currentPage, this.getTranslation.bind(this));
        console.log('👤 HTML de navigation généré:', navHTML);
        return navHTML;
    }

    getTranslation(key, fallback) {
        if (window.murazI18n && window.murazI18n.isInitialized()) {
            return window.murazI18n.t(key, fallback);
        }
        // Utiliser les traductions par défaut si le système n'est pas disponible
        const defaultTranslations = {
            'navigation.home': 'Accueil',
            'navigation.login': 'Connexion',
            'navigation.admin': 'Administration',
            'navigation.analyses': 'Analyses',
            'navigation.indices': 'Indices',
            'navigation.biologie': 'Biologie Moléculaire',
            'navigation.users': 'Utilisateurs',
            'navigation.collect': 'Collecte'
        };
        return defaultTranslations[key] || fallback;
    }

    setupNavigationEventListeners() {
        console.log('🔗 Configuration des gestionnaires d\'événements de navigation...');
        
        // Gestionnaire pour les liens de navigation
        const navLinks = document.querySelectorAll('.nav-item');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('/')) {
                    console.log('🧭 Navigation vers:', href);
                    // Laisser le navigateur gérer la navigation
                }
            });
        });
        
        console.log('✅ Gestionnaires d\'événements de navigation configurés');
    }

    ensureLanguageSelector() {
        setTimeout(() => {
            if (window.murazI18n && !document.getElementById('muraz-language-selector')) {
                console.log('🔧 Sélecteur de langue manquant, tentative de création...');
                window.murazI18n.setupLanguageSelector();
            }
            
            // S'assurer que le sélecteur de langue est au bon endroit selon la page
            const languageSelector = document.getElementById('muraz-language-selector');
            if (languageSelector) {
                let targetContainer;
                
                // Pour la page analyses, utiliser le conteneur de langue spécifique
                if (window.location.pathname.includes('analyses')) {
                    targetContainer = document.getElementById('language-container');
                    
                    // Si le conteneur n'existe pas, le créer
                    if (!targetContainer) {
                        const rightContainer = document.querySelector('.flex.items-center.space-x-4');
                        if (rightContainer) {
                            const languageContainer = document.createElement('div');
                            languageContainer.className = 'flex items-center space-x-2 ml-auto';
                            languageContainer.id = 'language-container';
                            rightContainer.parentNode.insertBefore(languageContainer, rightContainer.nextSibling);
                            targetContainer = languageContainer;
                        }
                    }
                }
                
                // Fallback vers la navigation principale
                if (!targetContainer) {
                    targetContainer = document.getElementById('main-nav');
                }
                
                if (targetContainer && languageSelector.parentNode !== targetContainer) {
                    targetContainer.appendChild(languageSelector);
                    console.log('🔧 Sélecteur de langue repositionné vers:', targetContainer.className || targetContainer.id);
                }
            }
        }, 100);
    }

    async logout() {
        console.log('🚪 Déconnexion...');
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ Déconnexion réussie');
                this.user = null;
                window.location.href = '/';
            } else {
                console.error('❌ Erreur lors de la déconnexion:', result.message);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error);
        }
    }

    setupEventListeners() {
        console.log('🔗 Configuration des gestionnaires d\'événements...');
        
        // Gestionnaire pour les changements de langue
        window.addEventListener('murazI18nLanguageChanged', () => {
            console.log('🌍 Changement de langue détecté, mise à jour de la navigation');
            setTimeout(() => {
                this.initNavigation();
            }, 100);
        });
        
        // Gestionnaire pour les changements de page
        window.addEventListener('popstate', () => {
            this.currentPage = window.location.pathname;
            this.initNavigation();
        });
        
        console.log('✅ Gestionnaires d\'événements configurés');
    }

    checkPagePermissions() {
        console.log('🔒 Vérification des permissions de page...');
        
        if (!this.user) {
            console.log('ℹ️ Utilisateur non connecté - permissions limitées');
            return;
        }
        
        // Vérifier les permissions selon le rôle
        const restrictedPages = {
            '/admin': ['SUPER_ADMIN'],
            '/admin/users': ['SUPER_ADMIN'],
            '/collect': ['SUPER_ADMIN', 'INVESTIGATOR'],
            '/analyses': ['SUPER_ADMIN', 'VIEWER'],
            '/indices': ['SUPER_ADMIN', 'VIEWER'],
            '/biologie-moleculaire': ['SUPER_ADMIN']
        };
        
        const requiredRoles = restrictedPages[this.currentPage];
        if (requiredRoles && !requiredRoles.includes(this.user.role)) {
            console.log('🚫 Accès refusé à', this.currentPage, '- rôle insuffisant');
            window.location.href = '/login';
            return;
        }
        
        console.log('✅ Permissions vérifiées pour', this.currentPage);
    }
}

// Instance globale
window.murazApp = new MurazApp();
