/**
 * 🌍 SYSTÈME DE TRADUCTION CENTRE MURAZ
 * 
 * Système professionnel d'internationalisation (i18n) pour la plateforme Centre MURAZ
 * Support : Français (FR) et Anglais (EN)
 * 
 * @author Centre MURAZ
 * @version 1.0.0
 * @date 2025
 */

class MurazI18nSystem {
    constructor() {
        this.currentLang = this.getStoredLanguage() || 'fr';
        this.fallbackLang = 'fr';
        this.translations = {};
        this.initialized = false;
        this.loading = false;
        
        console.log('🌍 MurazI18nSystem initialisé - Langue:', this.currentLang);
    }

    /**
     * Récupère la langue stockée dans le localStorage
     */
    getStoredLanguage() {
        try {
            return localStorage.getItem('muraz-lang') || 'fr';
        } catch (error) {
            console.warn('⚠️ Impossible d\'accéder au localStorage, utilisation du français par défaut');
            return 'fr';
        }
    }

    /**
     * Sauvegarde la langue dans le localStorage
     */
    setStoredLanguage(lang) {
        try {
            localStorage.setItem('muraz-lang', lang);
        } catch (error) {
            console.warn('⚠️ Impossible de sauvegarder la langue dans le localStorage');
        }
    }

    /**
     * Initialise le système de traduction
     */
    async init() {
        if (this.initialized || this.loading) {
            return;
        }

        this.loading = true;
        console.log('🚀 Initialisation du système de traduction Centre MURAZ...');

        try {
            await this.loadAllTranslations();
            this.applyAllTranslations();
            this.setupLanguageSelector();
            this.setupEventListeners();
            
            this.initialized = true;
            this.loading = false;
            
            console.log('✅ Système de traduction initialisé avec succès');
            
            // Émettre un événement personnalisé
            window.dispatchEvent(new CustomEvent('murazI18nReady', {
                detail: { language: this.currentLang }
            }));
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du système de traduction:', error);
            this.loading = false;
            throw error;
        }
    }

    /**
     * Charge toutes les traductions nécessaires
     */
    async loadAllTranslations() {
        const translationFiles = [
            'common',
            this.getCurrentPageContext()
        ].filter(Boolean);

        console.log('📚 Chargement des fichiers de traduction:', translationFiles);

        for (const file of translationFiles) {
            try {
                const response = await fetch(`/locales/${this.currentLang}/${file}.json`);
                
                if (!response.ok) {
                    throw new Error(`Fichier ${file}.json non trouvé (${response.status})`);
                }
                
                const translations = await response.json();
                this.translations[file] = translations;
                
                console.log(`✅ Traductions ${file} chargées`);
                
            } catch (error) {
                console.warn(`⚠️ Impossible de charger ${file}.json:`, error.message);
                
                // Utiliser les traductions communes comme fallback
                if (file !== 'common') {
                    this.translations[file] = {};
                }
            }
        }
    }

    /**
     * Détermine le contexte de la page actuelle
     */
    getCurrentPageContext() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/index.html') return 'index';
        if (path.includes('/login')) return 'login';
        if (path.includes('/admin')) return 'admin';
        if (path.includes('/analyses')) return 'analyses';
        if (path.includes('/indices')) return 'indices';
        if (path.includes('/biologie')) return 'biologie';
        
        return null;
    }

    /**
     * Méthode principale de traduction
     * @param {string} key - Clé de traduction (ex: "navigation.home")
     * @param {string} fallback - Texte de fallback
     * @param {string} context - Contexte spécifique (optionnel)
     * @returns {string} Texte traduit
     */
    t(key, fallback = null, context = null) {
        if (!key) {
            console.warn('⚠️ Clé de traduction vide');
            return fallback || key || '';
        }

        // Déterminer le contexte
        const translationContext = context || this.getCurrentPageContext() || 'common';
        
        // Chercher la traduction
        const keys = key.split('.');
        let value = this.translations[translationContext] || this.translations.common;
        
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }
        
        // Retourner la traduction ou le fallback
        const result = value || fallback || key;
        
        if (result === key && fallback === null) {
            console.warn(`⚠️ Traduction manquante: ${key} (contexte: ${translationContext})`);
        }
        
        return result;
    }

    /**
     * Traduction avec interpolation de variables
     * @param {string} key - Clé de traduction
     * @param {object} variables - Variables à interpoler
     * @param {string} fallback - Texte de fallback
     * @param {string} context - Contexte spécifique
     * @returns {string} Texte traduit avec variables interpolées
     */
    tInterpolate(key, variables = {}, fallback = null, context = null) {
        let text = this.t(key, fallback, context);
        
        // Interpoler les variables {{variable}}
        Object.keys(variables).forEach(variable => {
            const regex = new RegExp(`{{${variable}}}`, 'g');
            text = text.replace(regex, variables[variable]);
        });
        
        return text;
    }

    /**
     * Change la langue de l'application
     * @param {string} lang - Code de la langue (fr, en)
     */
    async changeLanguage(lang) {
        if (lang === this.currentLang) {
            console.log('ℹ️ Langue déjà sélectionnée:', lang);
            return;
        }

        if (!['fr', 'en'].includes(lang)) {
            console.error('❌ Langue non supportée:', lang);
            return;
        }

        console.log('🔄 Changement de langue:', this.currentLang, '→', lang);
        
        this.currentLang = lang;
        this.setStoredLanguage(lang);
        
        try {
            await this.loadAllTranslations();
            
            // Appliquer les traductions immédiatement
            this.applyAllTranslations();
            
            // Forcer la mise à jour de la navigation
            this.forceNavigationUpdate();
            
            // Mettre à jour le sélecteur
            this.updateLanguageSelector();
            
            // Debug: vérifier les éléments traduits
            this.debugTranslations();
            
            // Émettre un événement de changement de langue
            window.dispatchEvent(new CustomEvent('murazI18nLanguageChanged', {
                detail: { 
                    language: lang,
                    previousLanguage: this.currentLang 
                }
            }));
            
            console.log('✅ Langue changée avec succès:', lang);
            
        } catch (error) {
            console.error('❌ Erreur lors du changement de langue:', error);
        }
    }

    /**
     * Applique toutes les traductions aux éléments de la page
     */
    applyAllTranslations() {
        console.log('🔄 Application des traductions...');
        
        // Appliquer aux éléments avec data-i18n
        this.applyToElements('[data-i18n]', 'textContent');
        
        // Appliquer aux placeholders
        this.applyToElements('[data-i18n-placeholder]', 'placeholder');
        
        // Appliquer aux titres
        this.applyToElements('[data-i18n-title]', 'title');
        
        // Appliquer aux attributs alt
        this.applyToElements('[data-i18n-alt]', 'alt');
        
        // Appliquer aux attributs value
        this.applyToElements('[data-i18n-value]', 'value');
        
        // Forcer la mise à jour des éléments dynamiques
        this.updateDynamicElements();
        
        console.log('✅ Traductions appliquées');
    }

    /**
     * Force la mise à jour de la navigation
     */
    forceNavigationUpdate() {
        console.log('🔄 Force mise à jour de la navigation...');
        
        // Attendre un peu pour s'assurer que les traductions sont chargées
        setTimeout(() => {
            if (window.murazApp && typeof window.murazApp.initNavigation === 'function') {
                console.log('🧭 Appel de initNavigation...');
                window.murazApp.initNavigation();
            } else {
                console.warn('⚠️ murazApp.initNavigation non disponible');
            }
        }, 100);
        
        // Double vérification après un délai plus long
        setTimeout(() => {
            this.manualNavigationUpdate();
        }, 500);
    }

    /**
     * Mise à jour manuelle de la navigation
     */
    manualNavigationUpdate() {
        console.log('🔧 Mise à jour manuelle de la navigation...');
        
        // Trouver tous les éléments de navigation
        const navItems = document.querySelectorAll('#main-nav .nav-item span');
        console.log(`🔍 Éléments de navigation trouvés: ${navItems.length}`);
        
        navItems.forEach(item => {
            const text = item.textContent.trim();
            console.log(`📝 Texte actuel: "${text}"`);
            
            // Traduire selon le contenu
            if (text === 'Accueil' || text === 'Home') {
                const translation = this.t('navigation.home', 'Accueil');
                item.textContent = translation;
                console.log(`✅ Traduit Accueil/Home → ${translation}`);
            } else if (text === 'Connexion' || text === 'Login') {
                const translation = this.t('navigation.login', 'Connexion');
                item.textContent = translation;
                console.log(`✅ Traduit Connexion/Login → ${translation}`);
            }
        });
        
        // Mettre à jour le footer
        const footerElement = document.querySelector('[data-i18n="footer.copyright"]');
        if (footerElement) {
            const translation = this.t('footer.copyright', '© 2025 Centre MURAZ - Plateforme de Surveillance Arboviroses');
            footerElement.textContent = translation;
            console.log(`✅ Footer traduit: ${translation}`);
        }
    }

    /**
     * Debug: vérifier les traductions appliquées
     */
    debugTranslations() {
        console.log('🔍 DEBUG - Vérification des traductions:');
        
        // Vérifier les éléments avec data-i18n
        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`📊 Éléments avec data-i18n: ${elements.length}`);
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = element.textContent;
            console.log(`  - ${key}: "${text}"`);
        });
        
        // Vérifier la navigation
        const navItems = document.querySelectorAll('#main-nav .nav-item span');
        console.log(`🧭 Éléments de navigation: ${navItems.length}`);
        navItems.forEach(item => {
            console.log(`  - Navigation: "${item.textContent}"`);
        });
    }

    /**
     * Met à jour les éléments générés dynamiquement
     */
    updateDynamicElements() {
        console.log('🔄 Mise à jour des éléments dynamiques...');
        
        // Mettre à jour la navigation si app.js est disponible
        if (window.murazApp && typeof window.murazApp.initNavigation === 'function') {
            console.log('🧭 Mise à jour de la navigation dynamique...');
            window.murazApp.initNavigation();
        }
        
        // Mettre à jour les autres éléments dynamiques si nécessaire
        this.updatePageSpecificElements();
    }

    /**
     * Met à jour les éléments spécifiques à la page
     */
    updatePageSpecificElements() {
        const currentPage = this.getCurrentPageContext();
        
        if (currentPage === 'index') {
            // Mettre à jour les éléments spécifiques à la page d'accueil
            this.updateIndexPageElements();
        }
    }

    /**
     * Met à jour les éléments de la page d'accueil
     */
    updateIndexPageElements() {
        // Le footer devrait déjà être mis à jour par applyToElements
        // Mais on peut forcer la mise à jour si nécessaire
        const footerElement = document.querySelector('[data-i18n="footer.copyright"]');
        if (footerElement) {
            const translation = this.t('footer.copyright', '© 2025 Centre MURAZ - Plateforme de Surveillance Arboviroses');
            footerElement.textContent = translation;
        }
    }

    /**
     * Applique les traductions à un type d'éléments spécifique
     */
    applyToElements(selector, attribute) {
        const elements = document.querySelectorAll(selector);
        
        console.log(`🔍 Recherche d'éléments avec ${selector}: ${elements.length} trouvés`);
        
        elements.forEach(element => {
            const key = element.getAttribute(selector.replace(/[\[\]]/g, ''));
            const context = element.getAttribute('data-i18n-context');
            
            if (key) {
                const translation = this.t(key, null, context);
                
                if (translation !== key) {
                    element[attribute] = translation;
                    console.log(`✅ Traduit ${key}: ${translation}`);
                } else {
                    console.warn(`⚠️ Traduction manquante pour ${key}`);
                }
            }
        });
    }

    /**
     * Configure le sélecteur de langue dans la navigation
     */
    setupLanguageSelector() {
        // Vérifier si le sélecteur existe déjà
        if (document.getElementById('muraz-language-selector')) {
            return;
        }

        const selector = document.createElement('div');
        selector.id = 'muraz-language-selector';
        selector.className = 'language-selector flex items-center space-x-2 ml-4';
        selector.innerHTML = `
            <button id="lang-fr" class="lang-btn px-3 py-1 rounded text-sm font-medium transition-colors ${
                this.currentLang === 'fr' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }">
                FR
            </button>
            <button id="lang-en" class="lang-btn px-3 py-1 rounded text-sm font-medium transition-colors ${
                this.currentLang === 'en' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }">
                EN
            </button>
        `;
        
        // Ajouter à la navigation - essayer plusieurs emplacements
        const navContainer = document.querySelector('#main-nav') || 
                           document.querySelector('#nav-right-tools') || 
                           document.querySelector('nav .flex');
                           
        if (navContainer) {
            navContainer.appendChild(selector);
            console.log('✅ Sélecteur de langue ajouté à la navigation');
        } else {
            console.warn('⚠️ Conteneur de navigation non trouvé pour le sélecteur de langue');
            // Retry après un délai
            setTimeout(() => this.setupLanguageSelector(), 500);
        }
    }

    /**
     * Met à jour le sélecteur de langue
     */
    updateLanguageSelector() {
        const frBtn = document.getElementById('lang-fr');
        const enBtn = document.getElementById('lang-en');
        
        if (frBtn && enBtn) {
            // Réinitialiser les styles
            [frBtn, enBtn].forEach(btn => {
                btn.classList.remove('bg-blue-500', 'text-white', 'bg-gray-200', 'text-gray-700');
                btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            });
            
            // Appliquer le style actif
            const activeBtn = this.currentLang === 'fr' ? frBtn : enBtn;
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
            activeBtn.classList.add('bg-blue-500', 'text-white');
        }
    }

    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Écouteurs pour les boutons de langue
        document.addEventListener('click', (event) => {
            if (event.target.id === 'lang-fr') {
                this.changeLanguage('fr');
            } else if (event.target.id === 'lang-en') {
                this.changeLanguage('en');
            }
        });

        // Écouteur pour les changements de page (SPA)
        window.addEventListener('popstate', () => {
            if (this.initialized) {
                this.applyAllTranslations();
            }
        });
    }

    /**
     * Obtient la langue actuelle
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Vérifie si le système est initialisé
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Obtient toutes les traductions chargées
     */
    getTranslations() {
        return this.translations;
    }
}

// Instance globale
window.murazI18n = new MurazI18nSystem();

// Fonction de test globale pour debug
window.testTranslation = function() {
    console.log('🧪 TEST DE TRADUCTION');
    console.log('Langue actuelle:', window.murazI18n.currentLang);
    console.log('Traductions chargées:', Object.keys(window.murazI18n.translations));
    console.log('Test navigation.home:', window.murazI18n.t('navigation.home'));
    console.log('Test navigation.login:', window.murazI18n.t('navigation.login'));
    console.log('Test footer.copyright:', window.murazI18n.t('footer.copyright'));
    
    // Vérifier les éléments DOM
    const navItems = document.querySelectorAll('#main-nav .nav-item span');
    console.log('Éléments de navigation:', navItems.length);
    navItems.forEach((item, index) => {
        console.log(`Nav ${index}: "${item.textContent}"`);
    });
    
    const footer = document.querySelector('[data-i18n="footer.copyright"]');
    if (footer) {
        console.log('Footer:', footer.textContent);
    }
};

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.murazI18n.init();
    });
} else {
    window.murazI18n.init();
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MurazI18nSystem;
}
