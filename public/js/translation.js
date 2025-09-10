/**
 * Système de traduction multilingue RÉPARÉ pour la plateforme Centre MURAZ
 */
class TranslationManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'fr';
        this.translations = {};
        this.fallbackLanguage = 'fr';
        this.isLoaded = false;
        this.isInitialized = false;

        console.log('🌐 TranslationManager initialisé - Langue:', this.currentLanguage);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Déjà initialisé, ignoré');
            return;
        }

        this.isInitialized = true;
        console.log('🔄 Initialisation du TranslationManager...');

        try {
            await this.loadTranslations();
            this.isLoaded = true;
            console.log('✅ Traductions chargées avec succès');
            console.log('📊 Traductions disponibles:', Object.keys(this.translations));

            this.applyTranslations();
            this.setupEventListeners();

        } catch (error) {
            console.error('❌ Erreur lors du chargement des traductions:', error);
            this.isLoaded = false;
        }
    }

    setupEventListeners() {
        window.addEventListener('languageChanged', (event) => {
            console.log('🌐 Événement languageChanged reçu:', event.detail.language);
            this.applyTranslations();
        });
    }

    async loadTranslations() {
        console.log(`🔄 Chargement des traductions pour: ${this.currentLanguage}`);

        try {
            const response = await fetch(`/translations/${this.currentLanguage}.json`);
            console.log(`📡 Réponse HTTP: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`📊 Données reçues:`, Object.keys(data));

            this.translations[this.currentLanguage] = data;
            console.log(`✅ Traductions chargées pour ${this.currentLanguage}:`, Object.keys(data).length, 'sections');

        } catch (error) {
            console.error(`❌ Erreur chargement ${this.currentLanguage}:`, error);

            if (this.currentLanguage !== this.fallbackLanguage) {
                console.log(`🔄 Chargement de la langue de fallback: ${this.fallbackLanguage}`);
                try {
                    const fallbackResponse = await fetch(`/translations/${this.fallbackLanguage}.json`);
                    if (fallbackResponse.ok) {
                        const fallbackData = await fallbackResponse.json();
                        this.translations[this.fallbackLanguage] = fallbackData;
                        this.currentLanguage = this.fallbackLanguage;
                        console.log(`✅ Langue de fallback chargée: ${this.fallbackLanguage}`);
                    } else {
                        throw new Error(`Fallback HTTP ${fallbackResponse.status}`);
                    }
                } catch (fallbackError) {
                    console.error('❌ Erreur chargement fallback:', fallbackError);
                    throw fallbackError;
                }
            } else {
                throw error;
            }
        }
    }

    t(key, params = {}) {
        if (!this.isLoaded || !this.translations || !this.translations[this.currentLanguage]) {
            console.warn('⚠️ Traductions pas encore chargées pour:', key);
            return key;
        }

        const currentTranslations = this.translations[this.currentLanguage];
        const keys = key.split('.');
        let value = currentTranslations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`⚠️ Clé de traduction non trouvée: ${key}`);
                return key;
            }
        }

        if (typeof value !== 'string') {
            console.warn(`⚠️ Valeur de traduction invalide pour: ${key}`);
            return key;
        }

        return this.interpolate(value, params);
    }

    interpolate(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    async changeLanguage(languageCode) {
        console.log(`🔄 Changement de langue vers: ${languageCode}`);
        
        if (languageCode === this.currentLanguage) {
            console.log('⚠️ Langue déjà active, ignoré');
            return;
        }

        try {
            // Charger les nouvelles traductions si pas encore chargées
            if (!this.translations[languageCode]) {
                await this.loadTranslations();
            }

            this.currentLanguage = languageCode;
            localStorage.setItem('language', languageCode);
            
            console.log(`✅ Langue changée vers: ${languageCode}`);
            
            // Appliquer les nouvelles traductions
            this.applyTranslations();
            
            // Déclencher l'événement de changement de langue
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: languageCode }
            }));
            
        } catch (error) {
            console.error('❌ Erreur lors du changement de langue:', error);
            throw error;
        }
    }

    applyTranslations() {
        console.log('🔄 Application des traductions...');
        
        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`📊 Application des traductions à ${elements.length} éléments`);

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                const params = this.getElementParams(element);
                const translation = this.t(key, params);
                
                // Appliquer la traduction selon le type d'élément
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.type === 'submit' || element.type === 'button') {
                        element.value = translation;
                    } else {
                        element.placeholder = translation;
                    }
                } else if (element.hasAttribute('title')) {
                    element.title = translation;
                } else if (element.hasAttribute('alt')) {
                    element.alt = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Mettre à jour le titre de la page
        this.updatePageTitle();
        
        console.log('✅ Traductions appliquées');
    }

    getElementParams(element) {
        const params = {};
        const paramElements = element.querySelectorAll('[data-i18n-param]');
        
        paramElements.forEach(paramEl => {
            const key = paramEl.getAttribute('data-i18n-param');
            const value = paramEl.textContent;
            if (key && value) {
                params[key] = value;
            }
        });
        
        return params;
    }

    updatePageTitle() {
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const titleKey = titleElement.getAttribute('data-i18n');
            const translatedTitle = this.t(titleKey);
            document.title = translatedTitle;
            console.log(`📄 Titre de page mis à jour: ${translatedTitle}`);
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getAvailableLanguages() {
        return [
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'en', name: 'English', flag: '🇺🇸' }
        ];
    }

    createLanguageSelector() {
        const container = document.createElement('div');
        container.className = 'language-selector flex items-center space-x-2';
        
        const select = document.createElement('select');
        select.className = 'px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-muraz-blue focus:border-muraz-blue focus:outline-none transition-colors';
        
        const languages = this.getAvailableLanguages();
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = `${lang.flag} ${lang.name}`;
            if (lang.code === this.currentLanguage) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        container.appendChild(select);
        return container;
    }

    translateObject(obj) {
        const translated = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                translated[key] = this.t(value);
            } else if (typeof value === 'object' && value !== null) {
                translated[key] = this.translateObject(value);
            } else {
                translated[key] = value;
            }
        }
        return translated;
    }
}

// Initialiser le gestionnaire de traduction global
window.translationManager = new TranslationManager();
