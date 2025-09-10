// Interface Indices Entomologiques - Centre MURAZ
// Version optimisée sans code mort

class IndicesManager {
    constructor() {
        this.data = null;
        this.currentMonth = '';
        this.currentPage = 1;
        this.pageSize = 25;
        this.totalPages = 1;
        this.totalEntries = 0;
        this.init();
    }

    // Initialisation
    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    // Charger les données depuis l'API
    async loadData() {
        try {
            const response = await fetch('/api/indices');
            const result = await response.json();
            
            if (result.success) {
                this.data = result.data;
                this.renderAll();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.showError('Erreur lors du chargement: ' + error.message);
        }
    }

    // Configuration des événements
    setupEventListeners() {
        // Sélecteur de mois
        const monthSelector = document.getElementById('mois-selection-indices');
        if (monthSelector) {
            monthSelector.addEventListener('change', (e) => {
                this.currentMonth = e.target.value;
                this.currentPage = 1; // Reset à la première page
                this.updateDisplay();
            });
        }

        // Contrôles de pagination
        this.setupPaginationEvents();
    }

    // Configuration des événements de pagination
    setupPaginationEvents() {
        // Taille de page
        const pageSizeSelector = document.getElementById('table-page-size');
        if (pageSizeSelector) {
            pageSizeSelector.addEventListener('change', (e) => {
                this.pageSize = parseInt(e.target.value);
                this.currentPage = 1; // Reset à la première page
                this.updatePagination();
                this.renderTable();
            });
        }

        // Boutons de pagination
        const paginationButtons = [
            { id: 'first-page', action: () => this.goToPage(1) },
            { id: 'prev-page', action: () => this.goToPage(this.currentPage - 1) },
            { id: 'next-page', action: () => this.goToPage(this.currentPage + 1) },
            { id: 'last-page', action: () => this.goToPage(this.totalPages) }
        ];

        paginationButtons.forEach(({ id, action }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', action);
            }
        });

        // Input de page
        const pageInput = document.getElementById('current-page-input');
        if (pageInput) {
            pageInput.addEventListener('change', (e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= this.totalPages) {
                    this.goToPage(page);
                } else {
                    e.target.value = this.currentPage; // Reset si invalide
                }
            });
        }
    }

    // Rendu complet
    renderAll() {
        this.renderMonthSelector();
        this.renderIndicesCards();
        this.updatePagination();
        this.renderTable();
    }

    // SÉLECTEUR DE MOIS
    renderMonthSelector() {
        const selector = document.getElementById('mois-selection-indices');
        if (!selector || !this.data?.periodes) return;

        selector.innerHTML = '<option value="">Choisir un mois...</option>';
        
        this.data.periodes.forEach(periode => {
            const option = document.createElement('option');
            option.value = periode;
            option.textContent = this.formatPeriode(periode);
            selector.appendChild(option);
        });
    }

    // CARTES D'INDICES
    renderIndicesCards() {
        if (!this.data) return;

        // Utiliser les moyennes globales ou une période spécifique
        const indices = this.currentMonth ? this.calculateAveragesForPeriod(this.currentMonth) : this.data.moyennes;
        
        if (!indices) return;

        // Mettre à jour chaque carte avec unités
        const cartes = [
            { id: 'breteau-resultat', value: indices.ib, type: 'ib' },
            { id: 'maison-resultat', value: indices.im, type: 'im' },
            { id: 'recipient-resultat', value: indices.ir, type: 'ir' },
            { id: 'pondoir-resultat', value: indices.ipp, type: 'ipp' },
            { id: 'nymphale-resultat', value: indices.icn, type: 'icn' },
            { id: 'adultes-resultat', value: indices.iap_bg, type: 'iap_bg' },
            { id: 'prokopack-resultat', value: indices.iap_prokopack, type: 'iap_prokopack' }
        ];

        cartes.forEach(({ id, value, type }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = this.formatValue(value, type);
            }
        });
    }

    // TABLEAU RÉCAPITULATIF AVEC PAGINATION
    renderTable() {
        const tbody = document.getElementById('indices-table-body');
        if (!tbody || !this.data) return;

        tbody.innerHTML = '';

        // Calculer les données paginées
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const paginatedPeriodes = this.data.periodes.slice(startIndex, endIndex);

        paginatedPeriodes.forEach(periode => {
            // Utiliser directement les moyennes globales de l'API
            const moyennes = this.data.moyennes;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatPeriode(periode)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatValue(moyennes.ib, 'ib')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatValue(moyennes.im, 'im')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatValue(moyennes.ir, 'ir')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatValue(moyennes.ipp, 'ipp')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatValue(moyennes.icn, 'icn')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatValue(moyennes.iap_bg, 'iap_bg')}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatValue(moyennes.iap_prokopack, 'iap_prokopack')}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Mise à jour de la pagination
    updatePagination() {
        if (!this.data?.periodes) return;

        this.totalEntries = this.data.periodes.length;
        this.totalPages = Math.ceil(this.totalEntries / this.pageSize);
        
        // S'assurer que la page courante est valide
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages || 1;
        }

        this.updatePaginationInfo();
        this.updatePaginationButtons();
    }

    // Mise à jour des informations de pagination
    updatePaginationInfo() {
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.totalEntries);

        // Mettre à jour les éléments d'information
        const elements = {
            'current-start': start,
            'current-end': end,
            'total-entries': this.totalEntries,
            'total-pages': this.totalPages,
            'current-page-input': this.currentPage
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Mise à jour des boutons de pagination
    updatePaginationButtons() {
        const buttons = {
            'first-page': this.currentPage > 1,
            'prev-page': this.currentPage > 1,
            'next-page': this.currentPage < this.totalPages,
            'last-page': this.currentPage < this.totalPages
        };

        Object.entries(buttons).forEach(([id, enabled]) => {
            const button = document.getElementById(id);
            if (button) {
                button.disabled = !enabled;
                button.classList.toggle('opacity-50', !enabled);
                button.classList.toggle('cursor-not-allowed', !enabled);
            }
        });
    }

    // Aller à une page spécifique
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.updatePagination();
            this.renderTable();
        }
    }

    // Mise à jour de l'affichage
    updateDisplay() {
        this.renderIndicesCards();
        this.updatePagination();
        this.renderTable();
    }

    // Utilitaires
    calculateAveragesForPeriod(periode) {
        if (!this.data.data[periode]) return {};

        const secteurs = Object.values(this.data.data[periode]);
        const indices = ['ib', 'im', 'ir', 'ipp', 'icn', 'iap_bg', 'iap_prokopack'];
        
        const moyennes = {};
        indices.forEach(indice => {
            const valeurs = secteurs.map(secteur => secteur[indice]);
            const validValues = valeurs
                .filter(v => v !== null && v !== undefined && !isNaN(v))
                .map(v => typeof v === 'string' ? parseFloat(v) : v);
            moyennes[indice] = validValues.length > 0 ? 
                validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
        });
        
        return moyennes;
    }

    formatPeriode(periode) {
        if (!periode) return '';
        // Convertir "2024-01" en "Janvier 2024"
        const [year, month] = periode.split('-');
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return `${months[parseInt(month) - 1]} ${year}`;
    }

    formatValue(value, type = '') {
        if (value === null || value === undefined) return '--';
        
        const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
        
        // Ajouter les unités selon le type d'indice
        switch (type) {
            case 'ib':
            case 'im':
            case 'ir':
            case 'ipp':
            case 'icn':
                return `${formattedValue}%`;
            case 'iap_bg':
            case 'iap_prokopack':
                return `${formattedValue} moustiques`;
            default:
                return formattedValue;
        }
    }

    showError(message) {
        console.error('❌ Erreur Indices:', message);
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    window.indicesManager = new IndicesManager();
});
