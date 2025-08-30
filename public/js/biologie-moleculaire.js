// Biologie Moléculaire - Page JavaScript
class BiologieMoleculaire {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentTab = 'all';
        this.allData = [];
        this.filteredData = [];
        this.charts = {};
        
        this.init();
    }

    async init() {
        console.log('🧬 Initialisation de la page Biologie Moléculaire...');
        
        this.setupEventListeners();
        this.setupCharts();
        await this.loadData();
        this.updateDashboard();
    }

    setupEventListeners() {
        // Filtres
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
        document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());
        
        // Onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());
        
        // Actions
        document.getElementById('refresh-data').addEventListener('click', () => this.refreshData());
        document.getElementById('export-csv').addEventListener('click', () => this.exportToCSV());
        
        // Modal
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        
        // Fermer modal en cliquant à l'extérieur
        document.getElementById('detail-modal').addEventListener('click', (e) => {
            if (e.target.id === 'detail-modal') this.closeModal();
        });
    }

    setupCharts() {
        // Les graphiques ont été supprimés pour une interface plus équilibrée
        console.log('📊 Section graphiques supprimée pour optimiser l\'espace');
    }

    async loadData() {
        try {
            this.showLoading();
            console.log('📥 Chargement des données...');
            
            const response = await fetch('/api/biologie');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            this.allData = result.data || [];
            this.filteredData = [...this.allData];
            
            console.log(`✅ ${this.allData.length} enregistrements chargés`);
            this.renderData();
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            this.showError('Erreur lors du chargement des données');
        } finally {
            this.hideLoading();
        }
    }

    async loadStatistics() {
        try {
            const response = await fetch('/api/biologie/statistics');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            this.updateCharts(result.data);
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des statistiques:', error);
        }
    }

    updateCharts(statsData) {
        // Les graphiques ont été supprimés - cette fonction est conservée pour compatibilité
        console.log('📊 Données statistiques reçues:', statsData);
    }

    applyFilters() {
        const type = document.getElementById('filter-type').value;
        const sector = document.getElementById('filter-sector').value;
        const startDate = document.getElementById('filter-start-date').value;
        const endDate = document.getElementById('filter-end-date').value;

        this.filteredData = this.allData.filter(item => {
            // Filtre par type
            if (type && item.analysis_type !== type) return false;
            
            // Filtre par secteur
            if (sector && item.sector !== sector) return false;
            
            // Filtre par date
            if (startDate) {
                const itemDate = new Date(item.analysis_date);
                const start = new Date(startDate);
                if (itemDate < start) return false;
            }
            
            if (endDate) {
                const itemDate = new Date(item.analysis_date);
                const end = new Date(endDate);
                if (itemDate > end) return false;
            }
            
            return true;
        });

        this.currentPage = 1;
        this.renderData();
        console.log(`🔍 Filtres appliqués: ${this.filteredData.length} résultats`);
    }

    resetFilters() {
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-sector').value = '';
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        
        this.filteredData = [...this.allData];
        this.currentPage = 1;
        this.renderData();
        console.log('🔄 Filtres réinitialisés');
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Mettre à jour l'apparence des onglets
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active', 'border-blue-500', 'text-blue-600');
            button.classList.add('border-transparent', 'text-gray-500');
        });
        
        event.target.classList.add('active', 'border-blue-500', 'text-blue-600');
        
        // Filtrer les données selon l'onglet
        if (tab === 'all') {
            this.filteredData = [...this.allData];
        } else if (tab === 'pcr') {
            this.filteredData = this.allData.filter(item => 
                item.analysis_type === 'pcr' || item.analysis_type === 'rt_pcr'
            );
        } else if (tab === 'bioessai') {
            this.filteredData = this.allData.filter(item => 
                item.analysis_type === 'bioessai'
            );
        } else if (tab === 'repas') {
            this.filteredData = this.allData.filter(item => 
                item.analysis_type === 'origine_repas_sanguin'
            );
        }
        
        this.currentPage = 1;
        this.renderData();
        console.log(`📑 Onglet changé: ${tab}`);
    }

    renderData() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        const tbody = document.getElementById('data-table-body');
        tbody.innerHTML = '';
        
        if (pageData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        Aucune donnée trouvée
                    </td>
                </tr>
            `;
        } else {
            pageData.forEach(item => {
                const row = this.createDataRow(item);
                tbody.appendChild(row);
            });
        }
        
        this.updatePagination();
        this.updateTableInfo();
    }

    createDataRow(item) {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 fade-in';
        
        // Déterminer le type d'analyse
        let analysisType = item.analysis_type;
        if (item.analysis_type === 'pcr' || item.analysis_type === 'rt_pcr') {
            analysisType = 'PCR/RT-PCR';
        } else if (item.analysis_type === 'origine_repas_sanguin') {
            analysisType = 'Repas Sanguin';
        }
        
        // Créer les détails selon le type
        let details = '';
        if (item.allelic_frequency_a !== null) {
            details = `Fréq. A: ${(item.allelic_frequency_a * 100).toFixed(2)}%`;
        } else if (item.mortality_percentage !== null) {
            details = `Mortalité: ${item.mortality_percentage}%`;
        } else if (item.blood_meal_origins) {
            details = `Origines: ${item.blood_meal_origins.join(', ')}`;
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.analysis_type === 'pcr' || item.analysis_type === 'rt_pcr' ? 'bg-green-100 text-green-800' :
                    item.analysis_type === 'bioessai' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                }">
                    ${analysisType}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${item.sector}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${item.sample_count}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${new Date(item.analysis_date).toLocaleDateString('fr-FR')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${details}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="biologieMoleculaire.showDetails('${item.infos_id}')" 
                        class="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors">
                    <i class="fas fa-eye mr-1"></i>Voir
                </button>
            </td>
        `;
        
        return row;
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        document.getElementById('prev-page').disabled = this.currentPage <= 1;
        document.getElementById('next-page').disabled = this.currentPage >= totalPages;
        document.getElementById('current-page').textContent = this.currentPage;
    }

    updateTableInfo() {
        const start = (this.currentPage - 1) * this.itemsPerPage + 1;
        const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
        const total = this.filteredData.length;
        
        document.getElementById('showing-start').textContent = total > 0 ? start : 0;
        document.getElementById('showing-end').textContent = end;
        document.getElementById('total-entries').textContent = total;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderData();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderData();
        }
    }

    async showDetails(infosId) {
        try {
            const item = this.allData.find(data => data.infos_id == infosId);
            if (!item) {
                throw new Error('Données non trouvées');
            }
            
            this.populateModal(item);
            this.openModal();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage des détails:', error);
            this.showError('Erreur lors de l\'affichage des détails');
        }
    }

    populateModal(item) {
        document.getElementById('modal-title').textContent = `Détails de l'Analyse - ${item.analysis_type.toUpperCase()}`;
        
        let content = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <h4 class="font-semibold text-gray-800 border-b pb-2">Informations Générales</h4>
                    <div class="space-y-2">
                        <p><span class="font-medium">Type d'analyse:</span> ${item.analysis_type}</p>
                        <p><span class="font-medium">Stade des échantillons:</span> ${item.sample_stage}</p>
                        <p><span class="font-medium">Genre:</span> ${Array.isArray(item.genus) ? item.genus.join(', ') : item.genus}</p>
                        <p><span class="font-medium">Espèce:</span> ${item.species}</p>
                        <p><span class="font-medium">Secteur:</span> ${item.sector}</p>
                        <p><span class="font-medium">Nombre d'échantillons:</span> ${item.sample_count}</p>
                        <p><span class="font-medium">Date de collecte:</span> ${new Date(item.collection_date).toLocaleDateString('fr-FR')}</p>
                        <p><span class="font-medium">Date d'analyse:</span> ${new Date(item.analysis_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <h4 class="font-semibold text-gray-800 border-b pb-2">Détails Spécifiques</h4>
        `;
        
        // Ajouter les détails selon le type d'analyse
        if (item.allelic_frequency_a !== null) {
            content += `
                <div class="space-y-2">
                    <p><span class="font-medium">Espèces identifiées:</span> ${Array.isArray(item.identified_species) ? item.identified_species.join(', ') : item.identified_species}</p>
                    <p><span class="font-medium">Types de virus:</span> ${Array.isArray(item.virus_types) ? item.virus_types.join(', ') : item.virus_types}</p>
                    <p><span class="font-medium">Homozygotes AA:</span> ${item.homozygous_count}</p>
                    <p><span class="font-medium">Hétérozygotes Aa:</span> ${item.heterozygous_count}</p>
                    <p><span class="font-medium">Total population:</span> ${item.total_population}</p>
                    <div class="bg-green-50 p-3 rounded-lg">
                        <p class="font-medium text-green-800">Fréquences Alléliques Calculées:</p>
                        <p class="text-green-700">Allèle A: ${(item.allelic_frequency_a * 100).toFixed(2)}%</p>
                        <p class="text-green-700">Allèle A': ${(item.allelic_frequency_a_prime * 100).toFixed(2)}%</p>
                    </div>
                </div>
            `;
        } else if (item.mortality_percentage !== null) {
            content += `
                <div class="space-y-2">
                    <p><span class="font-medium">Types d'insecticides:</span> ${Array.isArray(item.insecticide_types) ? item.insecticide_types.join(', ') : item.insecticide_types}</p>
                    <p><span class="font-medium">Pourcentage de mortalité:</span> ${item.mortality_percentage}%</p>
                    <p><span class="font-medium">Pourcentage de survie:</span> ${item.survival_percentage}%</p>
                </div>
            `;
        } else if (item.blood_meal_origins) {
            content += `
                <div class="space-y-2">
                    <p><span class="font-medium">Origines du repas sanguin:</span> ${Array.isArray(item.blood_meal_origins) ? item.blood_meal_origins.join(', ') : item.blood_meal_origins}</p>
                </div>
            `;
        }
        
        if (item.complementary_info) {
            content += `
                <div class="space-y-2">
                    <h4 class="font-semibold text-gray-800 border-b pb-2">Informations Complémentaires</h4>
                    <p class="text-gray-700">${item.complementary_info}</p>
                </div>
            `;
        }
        
        content += `
                </div>
            </div>
        `;
        
        document.getElementById('modal-content').innerHTML = content;
    }

    openModal() {
        document.getElementById('detail-modal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('detail-modal').classList.add('hidden');
    }

    updateDashboard() {
        // Compter les analyses par type
        const pcrCount = this.allData.filter(item => 
            item.analysis_type === 'pcr' || item.analysis_type === 'rt_pcr'
        ).length;
        
        const bioessaiCount = this.allData.filter(item => 
            item.analysis_type === 'bioessai'
        ).length;
        
        const repasCount = this.allData.filter(item => 
            item.analysis_type === 'origine_repas_sanguin'
        ).length;
        
        // Mettre à jour les compteurs
        document.getElementById('total-analyses').textContent = this.allData.length;
        document.getElementById('pcr-count').textContent = pcrCount;
        document.getElementById('bioessai-count').textContent = bioessaiCount;
        document.getElementById('repas-count').textContent = repasCount;
        
        // Charger les statistiques pour les graphiques
        this.loadStatistics();
    }

    async refreshData() {
        console.log('🔄 Actualisation des données...');
        await this.loadData();
        this.updateDashboard();
    }

    exportToCSV() {
        if (this.filteredData.length === 0) {
            this.showError('Aucune donnée à exporter');
            return;
        }
        
        // Créer le contenu CSV
        const headers = [
            'Type d\'analyse', 'Secteur', 'Échantillons', 'Date d\'analyse', 
            'Genre', 'Espèce', 'Stade', 'Informations complémentaires'
        ];
        
        const csvContent = [
            headers.join(','),
            ...this.filteredData.map(item => [
                item.analysis_type,
                item.sector,
                item.sample_count,
                new Date(item.analysis_date).toLocaleDateString('fr-FR'),
                Array.isArray(item.genus) ? item.genus.join(';') : item.genus,
                item.species,
                item.sample_stage,
                item.complementary_info || ''
            ].join(','))
        ].join('\n');
        
        // Télécharger le fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `biologie_moleculaire_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📊 Export CSV terminé');
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showError(message) {
        // Créer une notification d'erreur
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialiser la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.biologieMoleculaire = new BiologieMoleculaire();
});

// Fonction globale pour l'export (accessible depuis la console)
window.exportBiologieData = () => {
    if (window.biologieMoleculaire) {
        window.biologieMoleculaire.exportToCSV();
    }
};
