// Biologie Moléculaire - Page JavaScript
class BiologieMoleculaire {
    constructor() {
        this.currentYear = this.getYearFromQuery() || 'current';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentTab = 'all';
        this.allData = [];
        this.filteredData = [];
        this.charts = {};
        
        this.init();
    }

    // Helper pour obtenir les traductions
    getTranslation(key, fallback = '') {
        if (window.murazI18n && window.murazI18n.translate) {
            return window.murazI18n.translate(key) || fallback;
        }
        return fallback;
    }

    async init() {
        console.log('🧬 Initialisation de la page Biologie Moléculaire...');
        
        this.setupEventListeners();
        this.setupCharts();
        await this.loadData();
        this.updateDashboard();
        
        // Rafraîchissement automatique toutes les 30 secondes
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        // Filtres
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
        document.getElementById('reset-filters').addEventListener('click', () => this.resetFilters());
        
        // Année (archives)
        const yearSelect = document.getElementById('year-selection-bio');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.currentYear = e.target.value;
                this.setYearInQuery(this.currentYear);
                this.refreshData();
            });
        }
        
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

    setupAutoRefresh() {
        console.log('🔄 Configuration du rafraîchissement automatique...');
        
        // Rafraîchir toutes les 30 secondes
        this.autoRefreshInterval = setInterval(() => {
            console.log('🔄 Rafraîchissement automatique des données...');
            this.refreshData();
        }, 30000);
        
        console.log('✅ Rafraîchissement automatique configuré (30s)');
    }

    async refreshData() {
        console.log('🔄 Rafraîchissement des données...');
        await this.loadData();
        this.updateDashboard();
    }

    async loadData() {
        try {
            this.showLoading();
            console.log('📥 Chargement des données...');
            
            await this.populateYearSelector();
            const query = this.currentYear && this.currentYear !== 'current' ? `?year=${encodeURIComponent(this.currentYear)}` : '';
            const response = await fetch(`/api/biologie${query}`);
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('🔍 Réponse complète de l\'API:', result);
            
            this.allData = result.data || [];
            this.filteredData = [...this.allData];
            this.updateArchiveBanner(result.year, result.mode);
            
            console.log(`✅ ${this.allData.length} enregistrements chargés`);
            console.log('🔍 Structure des données:', this.allData.length > 0 ? this.allData[0] : 'Aucune donnée');
            console.log('🔍 Clés disponibles:', this.allData.length > 0 ? Object.keys(this.allData[0]) : 'Aucune donnée');
            console.log('🔍 IDs dans allData:', this.allData.map(item => item.infos_id));
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
        } else if (item.analysis_type === 'bioessai') {
            analysisType = 'Bioessai';
            } else if (item.analysis_type === 'origine_repas_sanguin') {
                analysisType = 'Repas Sanguin';
        }
        
        // Créer les détails selon le type
        let details = '';
        if (item.human_percentage !== null && item.human_percentage !== undefined) {
            details = `Pourcentage humain: ${item.human_percentage}%`;
        } else if (item.animal_percentage !== null && item.animal_percentage !== undefined) {
            details = `Pourcentage animal: ${item.animal_percentage}%`;
        } else if (item.viral_load !== null && item.viral_load !== undefined) {
            details = `Charge virale: ${item.viral_load}`;
        } else if (item.result !== null && item.result !== undefined) {
            details = `Résultat: ${item.result}`;
        } else if (item.additional_info) {
            details = item.additional_info;
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
                ${item.analysis_date ? new Date(item.analysis_date).toLocaleDateString('fr-FR') : 
                  item.sample_date ? new Date(item.sample_date).toLocaleDateString('fr-FR') : 
                  item.collection_date ? new Date(item.collection_date).toLocaleDateString('fr-FR') : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${details || 'Aucun détail'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="window.biologieMoleculaire.showDetails('${item.id}')" 
                        class="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors">
                    <i class="fas fa-eye mr-1"></i><span data-i18n="biologie.table.action_view">Voir</span>
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

    async showDetails(id) {
        try {
            console.log('🔍 Recherche de l\'élément avec ID:', id);
            console.log('📊 Données disponibles:', this.allData.length, 'éléments');
            console.log('📋 IDs disponibles:', this.allData.map(item => item.id));
            
            // Essayer de trouver l'élément avec conversion de type (utiliser id)
            let item = this.allData.find(data => data.id == id);
            
            // Si pas trouvé, essayer avec conversion explicite
            if (!item) {
                const numericId = parseInt(id);
                if (!isNaN(numericId)) {
                    item = this.allData.find(data => data.id === numericId);
                }
            }
            console.log('🎯 Élément trouvé:', item);
            
            if (!item) {
                console.error('❌ Aucun élément trouvé avec l\'ID:', id);
                console.log('📊 Types d\'IDs dans allData:', this.allData.map(item => typeof item.id));
                throw new Error(`Données non trouvées pour l'ID: ${id}`);
            }
            
            this.populateModal(item);
            this.openModal();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'affichage des détails:', error);
            this.showError('Erreur lors de l\'affichage des détails');
        }
    }

    populateModal(item) {
        // Titre du modal
        const analysisTypeLabel = item.analysis_type === 'pcr' ? 'PCR' : 
                                 item.analysis_type === 'rt_pcr' ? 'RT-PCR' :
                                 item.analysis_type === 'bioessai' ? 'Bioessai' :
                                 item.analysis_type === 'origine_repas_sanguin' ? 'Origine Repas Sanguin' : 
                                 item.analysis_type.toUpperCase();
        
        document.getElementById('modal-title').textContent = `Analyse ${analysisTypeLabel} - ID ${item.id}`;
        
        // Formatage des dates
        const formatDate = (date) => {
            if (!date) return 'Non spécifié';
            return new Date(date).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };
        
        // Formatage des valeurs numériques
        const formatNumber = (value, decimals = 2) => {
            if (value === null || value === undefined) return 'Non spécifié';
            return Number(value).toFixed(decimals);
        };
        
        // Formatage des tableaux
        const formatArray = (arr) => {
            if (!arr || !Array.isArray(arr)) return 'Non spécifié';
            return arr.join(', ');
        };

        let content = `
            <div class="space-y-6">
                <!-- Informations Générales -->
                <div class="bg-white border border-gray-200 rounded-lg p-5">
                    <div class="flex items-center mb-4">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-info-circle text-blue-600 text-sm"></i>
                        </div>
                        <h4 class="text-lg font-semibold text-gray-800">${this.getTranslation('biologie.modal.general_info', 'Informations Générales')}</h4>
                    </div>
                    
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-3">
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-600">Identifiant</span>
                                <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">${item.id}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-600">Type d'analyse</span>
                                <span class="text-sm text-gray-800">${analysisTypeLabel}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-600">Stade</span>
                                <span class="text-sm text-gray-800">${item.sample_stage || this.getTranslation('biologie.modal.default_values.not_specified', 'Non spécifié')}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-600">Genre</span>
                                <span class="text-sm text-gray-800">${formatArray(item.mosquito_genus)}</span>
                            </div>
                            <div class="flex justify-between items-center py-2">
                                <span class="text-sm font-medium text-gray-600">Espèce</span>
                                <span class="text-sm text-gray-800">${item.mosquito_species || this.getTranslation('biologie.modal.default_values.not_specified', 'Non spécifié')}</span>
                            </div>
                        </div>
                        
                        <div class="space-y-3">
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-600">Secteur</span>
                                <span class="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">${item.sector || 'Non spécifié'}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-600">Échantillons</span>
                                <span class="text-sm text-gray-800">${item.sample_count || this.getTranslation('biologie.modal.default_values.not_specified', 'Non spécifié')}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-600">Date de collecte</span>
                                <span class="text-sm text-gray-800">${formatDate(item.collection_date)}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                                <span class="text-sm font-medium text-gray-600">Date d'analyse</span>
                                <span class="text-sm text-gray-800">${formatDate(item.analysis_date)}</span>
                            </div>
                            <div class="flex justify-between items-center py-2">
                                <span class="text-sm font-medium text-gray-600">Informations</span>
                                <span class="text-sm text-gray-800">${item.additional_info || 'Aucune'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Détails Spécifiques -->
                <div class="bg-white border border-gray-200 rounded-lg p-5">
                    <div class="flex items-center mb-4">
                        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <i class="fas fa-microscope text-green-600 text-sm"></i>
                        </div>
                        <h4 class="text-lg font-semibold text-gray-800">Résultats de l'Analyse</h4>
                    </div>
        `;
        
        // Ajouter les détails selon le type d'analyse
        if (item.analysis_type === 'pcr' || item.analysis_type === 'rt_pcr') {
            content += `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-gray-100">
                            <span class="text-sm font-medium text-gray-600">Fréquence allélique A</span>
                            <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">${formatNumber(item.allelic_frequency_a)}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-100">
                            <span class="text-sm font-medium text-gray-600">Fréquence allélique A'</span>
                            <span class="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">${formatNumber(item.allelic_frequency_a_prime)}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-100">
                            <span class="text-sm font-medium text-gray-600">Espèces identifiées</span>
                            <span class="text-sm text-gray-800">${formatArray(item.identified_species)}</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-sm font-medium text-gray-600">Types de virus</span>
                            <span class="text-sm text-gray-800">${formatArray(item.virus_types)}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-gray-100">
                            <span class="text-sm font-medium text-gray-600">Homozygotes</span>
                            <span class="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">${item.homozygous_count || 'Non spécifié'}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-100">
                            <span class="text-sm font-medium text-gray-600">Hétérozygotes</span>
                            <span class="text-sm font-mono bg-orange-100 text-orange-800 px-2 py-1 rounded">${item.heterozygous_count || 'Non spécifié'}</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-sm font-medium text-gray-600">Population totale</span>
                            <span class="text-sm font-mono bg-green-100 text-green-800 px-2 py-1 rounded">${item.total_population || 'Non spécifié'}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (item.analysis_type === 'bioessai') {
            content += `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-gray-100">
                            <span class="text-sm font-medium text-gray-600">Mortalité</span>
                            <span class="text-sm font-mono bg-red-100 text-red-800 px-2 py-1 rounded">${formatNumber(item.mortality_percentage)}%</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-sm font-medium text-gray-600">Survie</span>
                            <span class="text-sm font-mono bg-green-100 text-green-800 px-2 py-1 rounded">${formatNumber(item.survival_percentage)}%</span>
                        </div>
                </div>
                    
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2">
                            <span class="text-sm font-medium text-gray-600">Insecticides testés</span>
                            <span class="text-sm text-gray-800">${formatArray(item.insecticide_types)}</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (item.analysis_type === 'origine_repas_sanguin') {
            content += `
                <div class="grid grid-cols-1 gap-6">
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2">
                            <span class="text-sm font-medium text-gray-600">Origines des repas sanguins</span>
                            <span class="text-sm text-gray-800">${formatArray(item.blood_meal_origins)}</span>
                        </div>
                    </div>
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
        
        // Fonction pour échapper les valeurs CSV
        const escapeCSV = (value) => {
            if (value === null || value === undefined || value === '') return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };
        
        // Créer le contenu CSV optimisé
        const headers = [
            'ID', 'Type_Analyse', 'Secteur', 'Espece', 'Genre', 'Stade', 'Echantillons', 'Date_Analyse',
            'PCR_Frequence_A', 'PCR_Frequence_A_Prime', 'PCR_Especes_Identifiees', 'PCR_Types_Virus',
            'PCR_Homozygotes', 'PCR_Heterozygotes', 'PCR_Population_Totale',
            'Bioessai_Mortalite', 'Bioessai_Survie', 'Bioessai_Insecticides',
            'Repas_Origines'
        ];
        
        const csvContent = [
            headers.map(escapeCSV).join(','),
            ...this.filteredData.map(item => {
                // Données de base
                const baseData = [
                    item.infos_id || '',
                    item.analysis_type || '',
                    item.sector || '',
                    item.species || '',
                    Array.isArray(item.genus) ? item.genus.join(';') : (item.genus || ''),
                    item.sample_stage || '',
                    item.sample_count || '',
                    new Date(item.analysis_date).toLocaleDateString('fr-FR')
                ];
                
                // Données PCR spécifiques
                const pcrData = [
                    item.allelic_frequency_a ? (item.allelic_frequency_a * 100).toFixed(2) + '%' : '',
                    item.allelic_frequency_a_prime ? (item.allelic_frequency_a_prime * 100).toFixed(2) + '%' : '',
                    Array.isArray(item.identified_species) ? item.identified_species.join(';') : (item.identified_species || ''),
                    Array.isArray(item.virus_types) ? item.virus_types.join(';') : (item.virus_types || ''),
                    item.homozygous_count || '',
                    item.heterozygous_count || '',
                    item.total_population || ''
                ];
                
                // Données bioessai spécifiques
                const bioessaiData = [
                    item.mortality_percentage ? item.mortality_percentage + '%' : '',
                    item.survival_percentage ? item.survival_percentage + '%' : '',
                    Array.isArray(item.insecticide_types) ? item.insecticide_types.join(';') : (item.insecticide_types || '')
                ];
                
                // Données repas sanguin spécifiques
                const repasData = [
                    Array.isArray(item.blood_meal_origins) ? item.blood_meal_origins.join(';') : (item.blood_meal_origins || '')
                ];
                
                // Combiner toutes les données et les échapper
                const allData = [...baseData, ...pcrData, ...bioessaiData, ...repasData];
                return allData.map(escapeCSV).join(',');
            })
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
        
        console.log('📊 Export CSV optimisé terminé');
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

    // ===== Gestion année & archives =====
    getYearFromQuery() {
        const params = new URLSearchParams(window.location.search);
        return params.get('year');
    }

    setYearInQuery(year) {
        const url = new URL(window.location.href);
        if (!year || year === 'current') {
            url.searchParams.delete('year');
        } else {
            url.searchParams.set('year', year);
        }
        window.history.replaceState({}, '', url.toString());
    }

    async populateYearSelector() {
        const select = document.getElementById('year-selection-bio');
        if (!select) return;
        try {
            const res = await fetch('/api/archive/years');
            const json = await res.json();
            const years = Array.isArray(json.data) ? json.data : [];
            const currentOption = '<option value="current">Année en cours</option>';
            select.innerHTML = currentOption + years.map(y => `<option value="${y}">${y} (archivée)</option>`).join('');
            const value = this.currentYear || 'current';
            select.value = value;
        } catch (e) {
            console.warn('⚠️ Années d\'archives indisponibles:', e.message);
        }
    }

    updateArchiveBanner(year, mode) {
        const banner = document.getElementById('archive-banner-bio');
        const spanYear = document.getElementById('archive-year-bio');
        const isArchive = (mode === 'archive') || (this.currentYear && this.currentYear !== 'current');
        if (banner && spanYear) {
            if (isArchive) {
                banner.classList.remove('hidden');
                spanYear.textContent = (year || this.currentYear);
            } else {
                banner.classList.add('hidden');
                spanYear.textContent = '';
            }
        }
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

// Exposer la classe globalement
window.BiologieMoleculaire = BiologieMoleculaire;
