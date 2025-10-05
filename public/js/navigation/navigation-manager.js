// =====================================================
// GESTIONNAIRE DE NAVIGATION MODULAIRE
// =====================================================

import { generateGuestNavigation } from './guest-nav.js';
import { generateSuperAdminNavigation } from './super-admin-nav.js';
import { generateViewerNavigation } from './viewer-nav.js';
import { generateInvestigatorNavigation } from './investigator-nav.js';

/**
 * Gestionnaire principal de navigation modulaire
 * Garde exactement le même comportement que l'ancien système
 */
export class NavigationManager {
    constructor() {
        this.modules = {
            'GUEST': generateGuestNavigation,
            'SUPER_ADMIN': generateSuperAdminNavigation,
            'VIEWER': generateViewerNavigation,
            'INVESTIGATOR': generateInvestigatorNavigation
        };
    }

    /**
     * Génère la navigation selon le rôle de l'utilisateur
     * @param {Object} user - Utilisateur connecté (null si non connecté)
     * @param {string} currentPage - Page actuelle
     * @param {Function} getTranslation - Fonction de traduction
     * @returns {string} HTML de la navigation
     */
    generateNavigation(user, currentPage, getTranslation) {
        console.log('🧭 Génération navigation modulaire pour:', user ? user.role : 'GUEST');
        
        // Déterminer le rôle
        const role = user ? user.role : 'GUEST';
        
        // Obtenir le module correspondant
        const navigationModule = this.modules[role];
        
        if (!navigationModule) {
            console.error('❌ Module de navigation non trouvé pour le rôle:', role);
            return this.modules['GUEST'](currentPage, getTranslation);
        }
        
        // Générer la navigation avec le module approprié
        return navigationModule(currentPage, getTranslation);
    }

    /**
     * Ajoute un nouveau module de navigation
     * @param {string} role - Rôle utilisateur
     * @param {Function} module - Fonction de génération de navigation
     */
    addNavigationModule(role, module) {
        this.modules[role] = module;
        console.log('✅ Module de navigation ajouté pour le rôle:', role);
    }

    /**
     * Liste tous les modules disponibles
     * @returns {Array} Liste des rôles disponibles
     */
    getAvailableRoles() {
        return Object.keys(this.modules);
    }
}

// Instance globale
export const navigationManager = new NavigationManager();

export default NavigationManager;
