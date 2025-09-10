/**
 * Système de traduction multilingue RÉPARÉ pour la plateforme Centre MURAZ
 */
class TranslationManagerFixed {
    constructor() {
        this.currentLanguage = localStorage.getItem('language') || 'fr';
        this.translations = {};
        this.fallbackLanguage = 'fr';
        this.isLoaded = false;
        this.isInitialized = false;
        
        console.log('🌐 TranslationManagerFixed initialisé - Langue:', this.currentLanguage);
        
        // Initialiser immédiatement
        this.init();
    }

    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Déjà initialisé, ignoré');
            return;
        }
        
        this.isInitialized = true;
        console.log('🔄 Initialisation du TranslationManagerFixed...');
        
        try {
            await this.loadTranslations();
            this.isLoaded = true;
            console.log('✅ Traductions chargées avec succès');
            console.log('📊 Traductions disponibles:', Object.keys(this.translations));
            
            // Appliquer les traductions immédiatement
            this.applyTranslations();
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des traductions:', error);
            this.isLoaded = false;
        }
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
            
            // Charger la langue de fallback
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

    interpolate(template, params) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    async changeLanguage(language) {
        if (language === this.currentLanguage) {
            console.log('🔄 Même langue, pas de changement nécessaire');
            return;
        }

        console.log(`🔄 Changement de langue: ${this.currentLanguage} → ${language}`);
        
        try {
            this.currentLanguage = language;
            localStorage.setItem('language', language);
            
            // Recharger les traductions
            await this.loadTranslations();
            
            // Appliquer immédiatement
            this.applyTranslations();
            
            // Déclencher un événement personnalisé
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: this.currentLanguage }
            }));
            
            console.log(`✅ Langue changée vers: ${language}`);
            
        } catch (error) {
            console.error('❌ Erreur lors du changement de langue:', error);
        }
    }

    applyTranslations() {
        if (!this.isLoaded) {
            console.warn('⚠️ Traductions pas encore chargées');
            return;
        }

        const elements = document.querySelectorAll('[data-i18n]');
        console.log(`🔄 Application des traductions à ${elements.length} éléments`);

        let translatedCount = 0;
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (!key) return;
            
            const params = this.getElementParams(element);
            const translation = this.t(key, params);
            
            if (translation !== key) {
                // Gérer différents types d'éléments
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = translation;
                } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                    element.value = translation;
                } else if (element.hasAttribute('title')) {
                    element.title = translation;
                } else if (element.hasAttribute('alt')) {
                    element.alt = translation;
                } else {
                    element.textContent = translation;
                }
                translatedCount++;
            }
        });

        // Mettre à jour le titre de la page
        this.updatePageTitle();
        
        console.log(`✅ Traductions appliquées: ${translatedCount}/${elements.length} éléments`);
    }

    getElementParams(element) {
        const params = {};
        
        // Chercher les attributs data-param-*
        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-param-')) {
                const paramName = attr.name.replace('data-param-', '');
                params[paramName] = attr.value;
            }
        });
        
        return params;
    }

    updatePageTitle() {
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            const key = titleElement.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation !== key) {
                document.title = translation;
            }
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
        
        this.getAvailableLanguages().forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = `${lang.flag} ${lang.name}`;
            option.selected = lang.code === this.currentLanguage;
            select.appendChild(option);
        });
        
        container.appendChild(select);
        
        return container;
    }
}

// Remplacer l'ancien TranslationManager
console.log('🔄 Remplacement du TranslationManager par TranslationManagerFixed...');
window.translationManager = new TranslationManagerFixed();

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TranslationManagerFixed;
}
