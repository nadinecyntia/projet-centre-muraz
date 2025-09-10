// =====================================================
// ARCHITECTURE MODULAIRE PARFAITEMENT PROPRE - CENTRE MURAZ
// =====================================================

// Classe de base abstraite pour tous les graphiques
class BaseChart {
    constructor(containerId, chartName) {
        this.containerId = containerId;
        this.chartName = chartName;
        this.chart = null;
        this.data = null;
        this.isInitialized = false;
        this.errorMessage = null;
        
        console.log(`🚀 Initialisation ${this.chartName} (${this.containerId})`);
    }
    
    async init() {
        try {
            await this.loadData();
            this.createChart();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log(`✅ ${this.chartName} initialisé avec succès`);
        } catch (error) {
            console.error(`❌ Erreur ${this.chartName}:`, error);
            this.showError(`Erreur lors du chargement de ${this.chartName}: ${error.message}`);
        }
    }
    
    async loadData() {
        // Pour les graphiques œufs, ne pas charger les données ici car les graphiques indépendants le font
        if (this.chartName === 'Œufs par Secteur' || this.chartName === 'Œufs par Mois') {
            console.log(`📊 Pas de chargement de données pour ${this.chartName} (géré par le graphique indépendant)`);
            return;
        }
        
        const response = await fetch('/api/analyses');
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Erreur lors du chargement des données');
        }
        
        this.data = result.data;
        console.log(`📊 Données chargées pour ${this.chartName}`);
    }
    
    createChart() {
        const ctx = document.getElementById(this.containerId);
        if (!ctx) {
            throw new Error(`Container ${this.containerId} non trouvé`);
        }
        
        this.chart = new Chart(ctx, {
            type: this.getChartType(),
            data: this.prepareData(),
            options: this.getOptions()
        });
        
        console.log(`🎨 Graphique ${this.chartName} créé`);
    }
    
    updateChart(newData = null) {
        if (!this.chart) {
            console.warn(`⚠️ Tentative de mise à jour ${this.chartName} non initialisé`);
            return;
        }
        
        if (newData) {
            this.data = newData;
        }
        
        this.chart.data = this.prepareData();
        this.chart.update();
        console.log(`🔄 ${this.chartName} mis à jour`);
    }
    
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
            console.log(`🗑️ ${this.chartName} détruit`);
        }
    }
    
    showError(message) {
        this.errorMessage = message;
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Erreur ${this.chartName}</h3>
                            <div class="mt-2 text-sm text-red-700">${message}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Méthodes abstraites à implémenter par les classes filles
    getChartType() {
        throw new Error('getChartType() doit être implémentée par la classe fille');
    }
    
    prepareData() {
        throw new Error('prepareData() doit être implémentée par la classe fille');
    }
    
    getOptions() {
        throw new Error('getOptions() doit être implémentée par la classe fille');
    }
    
    setupEventListeners() {
        // Par défaut, pas d'événements spécifiques
    }
}

// =====================================================
// GRAPHIQUE 1: ŒUFS PAR SECTEUR - UTILISE LE NOUVEAU SYSTÈME
// =====================================================
class OeufsSecteurChart extends BaseChart {
    constructor() {
        super('oeufs-secteur-chart', 'Œufs par Secteur');
        this.selectedMonth = '';
        this.independentChart = null; // Référence au graphique indépendant
    }
    
    async init() {
        try {
            console.log('🚀 Initialisation du graphique œufs avec le nouveau système...');
            
            // Créer le graphique indépendant
            this.independentChart = new OeufsSecteurChartIndependent('oeufs-secteur-chart');
            await this.independentChart.init();
            
            this.isInitialized = true;
            console.log('✅ Graphique œufs initialisé avec le nouveau système');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du graphique œufs:', error);
            this.showError(`Erreur lors du chargement du graphique œufs: ${error.message}`);
        }
    }
    
    // Déléguer toutes les méthodes au graphique indépendant
    updateChart(newData = null) {
        if (this.independentChart) {
            this.independentChart.updateChart(newData);
        }
    }
    
    destroy() {
        if (this.independentChart) {
            this.independentChart.destroy();
        }
    }
    
    // Méthodes abstraites requises par BaseChart (non utilisées)
    getChartType() { return 'bar'; }
    prepareData() { return { labels: [], datasets: [] }; }
    getOptions() { return {}; }
    setupEventListeners() {}
}

// =====================================================
// GRAPHIQUE 2: ŒUFS PAR MOIS - UTILISE LE NOUVEAU SYSTÈME
// =====================================================
class OeufsMoisChart extends BaseChart {
    constructor() {
        super('oeufs-mois-chart', 'Œufs par Mois');
        this.independentChart = null; // Référence au graphique indépendant
    }
    
    async init() {
        try {
            console.log('🚀 Initialisation du graphique œufs par mois avec le nouveau système...');
            
            // Créer le graphique indépendant
            this.independentChart = new OeufsMoisChartIndependent('oeufs-mois-chart');
            await this.independentChart.init();
            
            this.isInitialized = true;
            console.log('✅ Graphique œufs par mois initialisé avec le nouveau système');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du graphique œufs par mois:', error);
            this.showError(`Erreur lors du chargement du graphique œufs par mois: ${error.message}`);
        }
    }
    
    // Déléguer toutes les méthodes au graphique indépendant
    updateChart(newData = null) {
        if (this.independentChart) {
            this.independentChart.updateChart(newData);
        }
    }
    
    destroy() {
        if (this.independentChart) {
            this.independentChart.destroy();
        }
    }
    
    // Méthodes abstraites requises par BaseChart (non utilisées)
    getChartType() { return 'line'; }
    prepareData() { return { labels: [], datasets: [] }; }
    getOptions() { return {}; }
    setupEventListeners() {}
}

// =====================================================
// GRAPHIQUE 3: DENSITÉ ANNUELLE
// =====================================================
class DensiteAnnuelleChart extends BaseChart {
    constructor() {
        super('densite-annuelle-chart', 'Densité Annuelle');
    }
    
    getChartType() {
        return 'line';
    }
    
    prepareData() {
        if (!this.data?.chartData?.adultes) {
            return { labels: [], datasets: [] };
        }
        
        const periodes = Object.keys(this.data.chartData.adultes);
        const periodesTriees = this.sortPeriodesChronologiquement(periodes);
        
        const data = periodesTriees.map(periode => {
            const secteurData = this.data.chartData.adultes[periode] || {};
            return Object.values(secteurData).reduce((sum, value) => sum + (value || 0), 0);
        });
        
        return {
            labels: periodesTriees,
            datasets: [{
                label: 'Total Moustiques Adultes',
                data: data,
                backgroundColor: '#3b82f620',
                borderColor: '#3b82f6',
                borderWidth: 3,
                fill: true,
                tension: 0.1
            }]
        };
    }
    
    getOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Densité Annuelle des Moustiques Adultes',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 100) return (value / 1000).toFixed(1) + 'k';
                            return value;
                        }
                    }
                }
            }
        };
    }
    
    sortPeriodesChronologiquement(periodes) {
        return periodes.sort((a, b) => {
            const [moisA, anneeA] = a.split(' ');
            const [moisB, anneeB] = b.split(' ');
            const moisIndex = {
                'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4,
                'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8,
                'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
            };
            
            if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
            return moisIndex[moisA] - moisIndex[moisB];
        });
    }
}

// =====================================================
// GRAPHIQUE 4: DENSITÉ PAR SECTEUR
// =====================================================
class DensiteSecteurChart extends BaseChart {
    constructor() {
        super('densite-secteur-chart', 'Densité par Secteur');
    }
    
    getChartType() {
        return 'bar';
    }
    
    prepareData() {
        if (!this.data?.chartData?.adultes) {
            return { labels: [], datasets: [] };
        }
        
        const secteurs = this.data.secteurs || [];
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        
        const data = secteurs.map(secteur => {
            return Object.values(this.data.chartData.adultes).reduce((sum, periode) => {
                return sum + (periode[secteur] || 0);
            }, 0);
        });
        
        return {
            labels: secteurs,
            datasets: [{
                label: 'Moustiques Adultes (total)',
                data: data,
                backgroundColor: colors.slice(0, secteurs.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    }
    
    getOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Densité des Moustiques Adultes par Secteur',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 100) return (value / 1000).toFixed(1) + 'k';
                            return value;
                        }
                    }
                }
            }
        };
    }
}

// =====================================================
// GRAPHIQUE 5: RÉPARTITION PAR GENRE
// =====================================================
class GenreChart extends BaseChart {
    constructor() {
        super('genre-chart', 'Répartition par Genre');
        this.selectedMonth = '';
    }
    
    getChartType() {
        return 'doughnut';
    }
    
    prepareData() {
        if (!this.data?.chartData?.adultesParGenre) {
            return { labels: [], datasets: [] };
        }
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        
        if (this.selectedMonth) {
            // Données pour le mois sélectionné
            const genreData = this.data.chartData.adultesParGenre[this.selectedMonth] || {};
            const labels = Object.keys(genreData);
            const data = Object.values(genreData);
            
            return {
                labels: labels,
                datasets: [{
                    label: `Répartition - ${this.selectedMonth}`,
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        } else {
            // Total de tous les mois
            const periodes = Object.keys(this.data.chartData.adultesParGenre);
            const genreTotals = {};
            
            periodes.forEach(periode => {
                const periodeData = this.data.chartData.adultesParGenre[periode] || {};
                Object.keys(periodeData).forEach(genre => {
                    genreTotals[genre] = (genreTotals[genre] || 0) + (periodeData[genre] || 0);
                });
            });
            
            const labels = Object.keys(genreTotals);
            const data = Object.values(genreTotals);
            
            return {
                labels: labels,
                datasets: [{
                    label: 'Répartition (total)',
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            };
        }
    }
    
    getOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Répartition des Moustiques par Genre',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'right'
                }
            }
        };
    }
    
    setupEventListeners() {
        const moisSelect = document.getElementById('mois-selection');
        if (moisSelect) {
            this.populateMonthSelector(moisSelect);
            moisSelect.addEventListener('change', (e) => {
                this.selectedMonth = e.target.value;
                this.updateChart();
            });
        }
    }
    
    populateMonthSelector(selectElement) {
        if (!this.data?.chartData?.adultesParGenre) return;
        
        selectElement.innerHTML = '<option value="">Tous les mois</option>';
        const periodes = Object.keys(this.data.chartData.adultesParGenre);
        const periodesTriees = this.sortPeriodesChronologiquement(periodes);
        
        periodesTriees.forEach(periode => {
            const option = document.createElement('option');
            option.value = periode;
            option.textContent = periode;
            selectElement.appendChild(option);
        });
    }
    
    sortPeriodesChronologiquement(periodes) {
        return periodes.sort((a, b) => {
            const [moisA, anneeA] = a.split(' ');
            const [moisB, anneeB] = b.split(' ');
            const moisIndex = {
                'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4,
                'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8,
                'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
            };
            
            if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
            return moisIndex[moisA] - moisIndex[moisB];
        });
    }
}

// =====================================================
// GRAPHIQUE 6: LARVES ET GÎTES
// =====================================================
class LarvesChart extends BaseChart {
    constructor() {
        super('larves-chart', 'Larves et Gîtes');
    }
    
    getChartType() {
        return 'bar';
    }
    
    prepareData() {
        if (!this.data?.chartData?.larves) {
            return { labels: [], datasets: [] };
        }
        
        const periodes = Object.keys(this.data.chartData.larves);
        const periodesTriees = this.sortPeriodesChronologiquement(periodes);
        const secteurs = this.data.secteurs || [];
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        
        const datasets = secteurs.map((secteur, index) => {
            const data = periodesTriees.map(periode => {
                return this.data.chartData.larves[periode]?.[secteur] || 0;
            });
            
            return {
                label: secteur,
                data: data,
                backgroundColor: colors[index % colors.length] + '80',
                borderColor: colors[index % colors.length],
                borderWidth: 2,
                fill: false
            };
        });
        
        return {
            labels: periodesTriees,
            datasets: datasets
        };
    }
    
    getOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution des Larves et Gîtes par Secteur',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 100) return (value / 1000).toFixed(1) + 'k';
                            return value;
                        }
                    }
                }
            }
        };
    }
    
    sortPeriodesChronologiquement(periodes) {
        return periodes.sort((a, b) => {
            const [moisA, anneeA] = a.split(' ');
            const [moisB, anneeB] = b.split(' ');
            const moisIndex = {
                'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4,
                'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8,
                'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
            };
            
            if (anneeA !== anneeB) return parseInt(anneeA) - parseInt(anneeB);
            return moisIndex[moisA] - moisIndex[moisB];
        });
    }
}

// =====================================================
// GESTIONNAIRE PRINCIPAL - ARCHITECTURE PROPRE
// =====================================================
class AnalysesChartManager {
    constructor() {
        this.charts = new Map();
        this.isInitialized = false;
    }
    
    async init() {
        console.log('🚀 Initialisation du gestionnaire de graphiques Analyses - Architecture Propre');
        
        try {
            // Créer tous les graphiques de manière indépendante
            this.charts.set('oeufsSecteur', new OeufsSecteurChart());
            this.charts.set('oeufsMois', new OeufsMoisChart());
            this.charts.set('densiteAnnuelle', new DensiteAnnuelleChart());
            this.charts.set('densiteSecteur', new DensiteSecteurChart());
            this.charts.set('genre', new GenreChart());
            this.charts.set('larves', new LarvesChart());
            
            // Initialiser chaque graphique indépendamment
            const initPromises = Array.from(this.charts.values()).map(chart => chart.init());
            await Promise.allSettled(initPromises);
            
            this.isInitialized = true;
            console.log('✅ Gestionnaire de graphiques Analyses initialisé - Architecture Propre');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du gestionnaire:', error);
        }
    }
    
    updateAllCharts() {
        if (!this.isInitialized) {
            console.warn('⚠️ Gestionnaire non initialisé');
            return;
        }
        
        this.charts.forEach(chart => {
            if (chart.isInitialized) {
                chart.updateChart();
            }
        });
    }
    
    destroyAllCharts() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
        this.isInitialized = false;
    }
    
    getChartStatus() {
        const status = {};
        this.charts.forEach((chart, name) => {
            status[name] = {
                initialized: chart.isInitialized,
                hasError: !!chart.errorMessage,
                errorMessage: chart.errorMessage
            };
        });
        return status;
    }
}

// =====================================================
// INITIALISATION GLOBALE - ARCHITECTURE PROPRE
// =====================================================
let analysesChartManager = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Page Analyses chargée - Architecture Modulaire Propre');
    
    try {
        analysesChartManager = new AnalysesChartManager();
        await analysesChartManager.init();
        
        // Afficher le statut des graphiques
        const status = analysesChartManager.getChartStatus();
        console.log('📊 Statut des graphiques:', status);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la page Analyses:', error);
    }
});

// Fonction utilitaire pour afficher les erreurs
function showError(message) {
    console.error('❌ Erreur Analyses:', message);
}
