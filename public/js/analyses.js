// Gestionnaire de thème pour les graphiques
class ThemeManager {
    constructor() {
        this.currentTheme = 'sober'; // Force toujours les couleurs sobres
        this.initThemeToggle();
        this.updateThemeIndicator();
    }

    initThemeToggle() {
        // Pas de basculement - toujours couleurs sobres
        this.updateThemeIndicator();
    }

    updateThemeIndicator() {
        const indicator = document.getElementById('currentTheme');
        if (indicator) {
            indicator.textContent = 'Couleurs légères';
        }
    }

    getThemeColors() {
        // Couleurs légères et professionnelles
        return {
            primary: '#4a90e2',      // Bleu léger professionnel
            secondary: '#7b68ee',    // Violet léger
            accent: '#50c878',       // Vert léger
            background: '#ffffff',   // Blanc pur
            border: '#e0e0e0'        // Gris très clair
        };
    }

    getColorArray(count) {
        // Palette de couleurs légères et professionnelles
        return [
            '#4a90e2',  // Bleu léger
            '#7b68ee',  // Violet léger
            '#50c878',  // Vert léger
            '#ffa500',  // Orange léger
            '#ff6b6b',  // Rouge léger
            '#20b2aa',  // Turquoise léger
            '#98fb98',  // Vert clair
            '#ffb6c1',  // Rose léger
            '#dda0dd',  // Violet clair
            '#f0e68c'   // Jaune léger
        ].slice(0, count);
    }

    getColorWithAlpha(color, alpha = 0.8) {
        const colors = this.getThemeColors();
        const colorMap = {
            primary: colors.primary,
            secondary: colors.secondary,
            accent: colors.accent
        };
        const baseColor = colorMap[color] || color;
        return baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
    }

    // Fonction simplifiée pour obtenir des couleurs sobres
    getSoberColors(count) {
        const soberPalette = [
            '#2c3e50',  // Bleu-gris foncé
            '#34495e',  // Gris anthracite  
            '#5d6d7e',  // Gris bleuté
            '#7f8c8d',  // Gris moyen
            '#95a5a6',  // Gris clair
            '#85929e',  // Gris bleu clair
            '#566573',  // Gris foncé
            '#a6acaf'   // Gris très clair
        ];
        return soberPalette.slice(0, count);
    }

    updateAllCharts() {
        // Mettre à jour tous les graphiques qui dépendent des filtres
        if (this.charts.eggsSectorMonth) {
            const data = this.processEggsSectorMonthData();
            this.charts.eggsSectorMonth.data.labels = data.labels;
            this.charts.eggsSectorMonth.data.datasets = data.datasets;
            this.charts.eggsSectorMonth.update();
        }

        if (this.charts.eggsMonthEnvironment) {
            const data = this.processEggsMonthEnvironmentData();
            this.charts.eggsMonthEnvironment.data.labels = data.labels;
            this.charts.eggsMonthEnvironment.data.datasets = data.datasets;
            this.charts.eggsMonthEnvironment.update();
        }

        if (this.charts.sitesSectorMonth) {
            const data = this.processSitesSectorMonthData();
            this.charts.sitesSectorMonth.data.labels = data.labels;
            this.charts.sitesSectorMonth.data.datasets = data.datasets;
            this.charts.sitesSectorMonth.update();
        }

        if (this.charts.aedesSectorMonth) {
            const data = this.processAedesSectorMonthData();
            this.charts.aedesSectorMonth.data.labels = data.labels;
            this.charts.aedesSectorMonth.data.datasets = data.datasets;
            this.charts.aedesSectorMonth.update();
        }

        if (this.charts.siteTypeEnvironment) {
            const data = this.processSiteTypeEnvironmentData();
            this.charts.siteTypeEnvironment.data.labels = data.labels;
            this.charts.siteTypeEnvironment.data.datasets = data.datasets;
            this.charts.siteTypeEnvironment.update();
        }

        if (this.charts.aedesMethodLocation) {
            const data = this.processAedesMethodLocationData();
            this.charts.aedesMethodLocation.data.labels = data.labels;
            this.charts.aedesMethodLocation.data.datasets = data.datasets;
            this.charts.aedesMethodLocation.update();
        }
    }
}

// Gestionnaire principal des analyses
class AnalysesManager {
    constructor() {
        this.themeManager = new ThemeManager();
        this.charts = {};
        this.data = {};
        this.currentYear = this.getYearFromQuery() || 'current';
        this.currentEnvironment = 'all'; // Filtre milieu par défaut
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initialisation des analyses entomologiques...');
            await this.loadData();
            this.createCharts();
            console.log('✅ Analyses initialisées avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors du chargement des données');
        }
    }

    async loadData() {
        console.log('📊 Chargement des données...');
        
        try {
            // Charger toutes les données en parallèle
            await this.populateYearSelector();
            const [eggsData, larvaeData, adultsData] = await Promise.all([
                this.fetchEggsData(),
                this.fetchLarvaeData(),
                this.fetchAdultsData()
            ]);

            this.data = {
                eggs: eggsData,
                larvae: larvaeData,
                adults: adultsData
            };

            console.log('✅ Données chargées:', {
                eggs: eggsData?.length || 0,
                larvae: larvaeData?.length || 0,
                adults: adultsData?.length || 0
            });

            // Initialiser les filtres après le chargement des données
            this.initializeFilters();

        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    async fetchEggsData() {
        const query = this.currentYear && this.currentYear !== 'current' ? `?year=${encodeURIComponent(this.currentYear)}` : '';
        const response = await fetch(`/api/analyses/eggs${query}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des données œufs');
        const result = await response.json();
        this.updateArchiveBanner(result.year, result.mode);
        return result.data || [];
    }

    async fetchLarvaeData() {
        const query = this.currentYear && this.currentYear !== 'current' ? `?year=${encodeURIComponent(this.currentYear)}` : '';
        const response = await fetch(`/api/analyses/breeding${query}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des données larves');
        const result = await response.json();
        return result.data || [];
    }

    async fetchAdultsData() {
        const query = this.currentYear && this.currentYear !== 'current' ? `?year=${encodeURIComponent(this.currentYear)}` : '';
        const response = await fetch(`/api/analyses/mosquitoes${query}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des données adultes');
        const result = await response.json();
        return result.data || [];
    }

    createCharts() {
        console.log('📈 Création des graphiques...');
        
        // 1. Œufs par secteur et par mois
        this.createEggsSectorMonthChart();
        
        // 2. Évolution des œufs dans l'année
        this.createEggsEvolutionChart();
        
        // 2.5. Œufs par mois et par milieu
        this.createEggsMonthEnvironmentChart();
        
        // 3. Larves par mois par secteur
        this.createLarvaeSectorChart();
        
        // 3.1. Gîtes par secteur par mois
        this.createSitesSectorMonthChart();
        
        // 3.2. Aedes par secteur par mois
        this.createAedesSectorMonthChart();
        
        // 3.3. Types de gîtes par milieu
        this.createSiteTypeEnvironmentChart();
        
        // 3.4. Aedes par méthode et lieu de capture
        this.createAedesMethodLocationChart();
        
        // 4. Courbe densité moustiques adultes
        this.createAdultsDensityChart();
        
        // 5. Densité par secteur par mois
        this.createAdultsSectorChart();
        
        // 6. Densité par genre
        this.createAdultsGenusChart();
    }

    // Initialiser les filtres
    initializeFilters() {
        console.log('🎛️ Initialisation des filtres...');
        
        // Sélecteur d'année global (analyses)
        const yearSelect = document.getElementById('year-selection-analyses');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.currentYear = e.target.value;
                this.setYearInQuery(this.currentYear);
                this.loadData().then(() => {
                    // Recréer les graphiques après rechargement
                    Object.values(this.charts).forEach(ch => ch?.destroy?.());
                    this.charts = {};
                    this.createCharts();
                });
            });
        }

        // Gestion du filtre milieu
        const environmentSelect = document.getElementById('environment-filter-analyses');
        if (environmentSelect) {
            environmentSelect.addEventListener('change', (e) => {
                this.currentEnvironment = e.target.value;
                this.updateAllCharts();
            });
        }

        // Initialiser le filtre des secteurs pour l'évolution des œufs
        this.initializeSectorFilter();
        
        // Initialiser le filtre des mois pour la densité par genre
        this.initializeMonthFilter();
    }

    // Initialiser le filtre des secteurs
    initializeSectorFilter() {
        const sectorFilter = document.getElementById('sectorFilter');
        if (!sectorFilter) {
            console.error('❌ Élément sectorFilter non trouvé');
            return;
        }

        // Récupérer tous les secteurs uniques des données œufs
        const sectors = new Set();
        this.data.eggs.forEach(item => {
            if (item.sector) {
                // Gérer les secteurs comme string simple
                sectors.add(item.sector);
            }
        });
        
        const sectorsArray = Array.from(sectors);
        console.log('🎯 Secteurs trouvés:', sectorsArray);
        
        // Vider le select et ajouter les options
        sectorFilter.innerHTML = '<option value="all">Tous les secteurs</option>';
        sectorsArray.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector;
            option.textContent = sector;
            sectorFilter.appendChild(option);
        });

        // Ajouter l'événement de changement
        sectorFilter.addEventListener('change', (e) => {
            console.log('🔄 Changement de secteur:', e.target.value);
            this.updateEggsEvolutionChart(e.target.value);
        });
    }

    // Initialiser le filtre des mois
    initializeMonthFilter() {
        const monthFilter = document.getElementById('monthFilter');
        if (!monthFilter) return;

        // Récupérer tous les mois uniques des données moustiques adultes
        const months = [...new Set(this.data.adults.map(item => {
            const date = new Date(item.visit_date);
            return this.getMonthLabel(date);
        }).filter(Boolean))];
        
        // Vider le select et ajouter les options
        monthFilter.innerHTML = '<option value="all">Tous les mois</option>';
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            monthFilter.appendChild(option);
        });

        // Ajouter l'événement de changement
        monthFilter.addEventListener('change', (e) => {
            this.updateAdultsGenusChart(e.target.value);
        });
    }

    // 1. Œufs par secteur et par mois
    createEggsSectorMonthChart() {
        const ctx = document.getElementById('eggsSectorMonthChart');
        if (!ctx) return;

        const data = this.processEggsSectorMonthData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
        
        this.charts.eggsSectorMonth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Nombre d\'œufs par secteur et par mois',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} œufs`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig('Nombre d\'œufs', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Mois'
                        }
                    }
                }
            }
        });
    }

    // 2. Évolution des œufs dans l'année
    createEggsEvolutionChart() {
        const ctx = document.getElementById('eggsEvolutionChart');
        if (!ctx) return;

        const data = this.processEggsEvolutionData('all');
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.values);
        
        this.charts.eggsEvolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
            datasets: [{
                    label: 'Total œufs collectés',
                    data: data.values,
                    borderColor: this.themeManager.getThemeColors().primary,
                    backgroundColor: this.themeManager.getColorWithAlpha('primary', 0.1),
                borderWidth: 3,
                fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Évolution du nombre total d\'œufs collectés dans l\'année',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `Total œufs: ${this.formatLargeValue(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig('Nombre d\'œufs', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Mois'
                        }
                    }
                }
            }
        });
    }

    // 2.5. Œufs par mois et par milieu
    createEggsMonthEnvironmentChart() {
        const ctx = document.getElementById('eggsMonthEnvironmentChart');
        if (!ctx) return;

        const data = this.processEggsMonthEnvironmentData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
        
        this.charts.eggsMonthEnvironment = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                        text: 'Nombre d\'œufs par mois et par milieu',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} œufs`;
                            }
                        }
                }
            },
            scales: {
                    y: this.getAdaptiveScaleConfig('Nombre d\'œufs', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Mois'
                        }
                    }
                }
            }
        });
    }

    // 3. Larves par mois par secteur
    createLarvaeSectorChart() {
        const ctx = document.getElementById('larvaeSectorChart');
        if (!ctx) return;

        const data = this.processLarvaeSectorData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
        
        this.charts.larvaeSector = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Nombre total de larves et nymphes par mois par secteur',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} larves + nymphes`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig('Nombre de larves + nymphes', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Mois'
                        }
                    }
                }
            }
        });
    }

    createSitesSectorMonthChart() {
        const ctx = document.getElementById('sitesSectorMonthChart');
        if (!ctx) return;

        const data = this.processSitesSectorMonthData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
        
        this.charts.sitesSectorMonth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                        text: 'Nombre de gîtes par secteur par mois',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} gîtes`;
                            }
                        }
                }
            },
            scales: {
                    y: this.getAdaptiveScaleConfig('Nombre de gîtes', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Mois'
                        }
                    }
                }
            }
        });
    }

    createAedesSectorMonthChart() {
        const ctx = document.getElementById('aedesSectorMonthChart');
        if (!ctx) return;

        const data = this.processAedesSectorMonthData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
        
        this.charts.aedesSectorMonth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Nombre d\'Aedes par secteur et par mois',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} Aedes`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig('Nombre d\'Aedes', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Mois'
                        }
                    }
                }
            }
        });
    }

    createSiteTypeEnvironmentChart() {
        const ctx = document.getElementById('siteTypeEnvironmentChart');
        if (!ctx) return;

        const data = this.processSiteTypeEnvironmentData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
        
        this.charts.siteTypeEnvironment = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Quantité par classe de gîtes selon le milieu',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} gîtes`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig('Nombre de gîtes', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Milieu'
                        }
                    }
                }
            }
        });
    }

    createAedesMethodLocationChart() {
        const ctx = document.getElementById('aedesMethodLocationChart');
        if (!ctx) return;

        const data = this.processAedesMethodLocationData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
        
        this.charts.aedesMethodLocation = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Nombre d\'Aedes par méthode de collecte et lieu de capture',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} Aedes`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig('Nombre d\'Aedes', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Lieu de capture'
                        }
                    }
                }
            }
        });
    }

    // 4. Courbe densité moustiques adultes
    createAdultsDensityChart() {
        const ctx = document.getElementById('adultsDensityChart');
        if (!ctx) return;

        const data = this.processAdultsDensityData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.values);
        
        this.charts.adultsDensity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Densité moustiques adultes',
                    data: data.values,
                    borderColor: this.themeManager.getThemeColors().accent,
                    backgroundColor: this.themeManager.getColorWithAlpha('accent', 0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Courbe du nombre total ou densité/an des moustiques adultes',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `Densité: ${this.formatLargeValue(value)} moustiques`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig('Nombre de moustiques', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Mois'
                        }
                    }
                }
            }
        });
    }

    // 5. Densité par secteur par mois
    createAdultsSectorChart() {
        const ctx = document.getElementById('adultsSectorChart');
        if (!ctx) return;

        const data = this.processAdultsSectorData();
        
        // Calculer la valeur maximale pour adapter l'échelle
        const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
        
        this.charts.adultsSector = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Densité par secteur par mois',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} moustiques`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig('Nombre de moustiques', maxValue),
                    x: {
                        title: {
                            display: true,
                            text: 'Mois'
                        }
                    }
                }
            }
        });
    }

    // 6. Densité par genre
    createAdultsGenusChart() {
        const ctx = document.getElementById('adultsGenusChart');
        if (!ctx) return;

        const data = this.processAdultsGenusData();
        
        this.charts.adultsGenus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.themeManager.getColorArray(data.labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                        text: 'Densité par genre',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${this.formatLargeValue(value)} moustiques (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Méthodes de traitement des données
    processEggsSectorMonthData() {
        if (!this.data.eggs || this.data.eggs.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Grouper par secteur et mois, puis sommer eggs_count
        const groupedData = {};
        const months = new Set();
        const sectors = new Set();

        this.data.eggs.forEach(item => {
            if (!item.visit_date || !item.sector || !item.eggs_count) return;
            
            // Appliquer le filtre milieu
            if (this.currentEnvironment !== 'all' && item.environment !== this.currentEnvironment) {
                return;
            }
            
            const date = new Date(item.visit_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = this.getMonthLabel(date);
            
            // Gérer les secteurs comme string (pas d'array)
            const sector = item.sector;
            if (!sector) return;
            
            months.add(monthLabel);
            sectors.add(sector);
            
            const key = `${sector}_${monthKey}`;
            if (!groupedData[key]) {
                groupedData[key] = { sector: sector, month: monthLabel, count: 0 };
            }
            groupedData[key].count += parseInt(item.eggs_count) || 0;
        });

        // Créer les datasets par secteur
        const datasets = [];
        const colors = this.themeManager.getColorArray(sectors.size);
        let colorIndex = 0;

        Array.from(sectors).forEach(sector => {
            const data = Array.from(months).map(month => {
                const key = Object.keys(groupedData).find(k => 
                    groupedData[k].sector === sector && groupedData[k].month === month
                );
                return key ? groupedData[key].count : 0;
            });

            datasets.push({
                label: sector,
                data: data,
                backgroundColor: this.themeManager.getColorWithAlpha(colors[colorIndex], 0.8),
                borderColor: colors[colorIndex],
                borderWidth: 1
            });
            colorIndex++;
        });

        return {
            labels: this.sortMonthsChronologically(Array.from(months)),
            datasets: datasets
        };
    }


    processLarvaeSectorData() {
        if (!this.data.larvae || this.data.larvae.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Grouper par secteur et par mois
        const groupedData = {};
        const months = new Set();
        const sectors = new Set();

        this.data.larvae.forEach(item => {
            if (!item.visit_date || !item.sector) return;
            
            // Vérifier que au moins une des valeurs n'est pas null/undefined
            const larvaeCount = (item.larvae_count !== null && item.larvae_count !== undefined) ? parseInt(item.larvae_count) || 0 : 0;
            const nymphsCount = (item.nymphs_count !== null && item.nymphs_count !== undefined) ? parseInt(item.nymphs_count) || 0 : 0;
            
            // Si les deux sont null/undefined, on ignore cette entrée
            if (item.larvae_count === null && item.nymphs_count === null) return;
            
            const date = new Date(item.visit_date);
            const month = date.getMonth() + 1; // 1-12
            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            const monthName = monthNames[month - 1];
            
            // Gérer les secteurs comme string (pas d'array)
            const sector = item.sector;
            if (!sector) return;
            
            months.add(monthName);
            sectors.add(sector);
            
            const key = `${sector}_${monthName}`;
            if (!groupedData[key]) {
                groupedData[key] = { sector: sector, period: monthName, count: 0 };
            }
            // Additionner larvae_count + nymphs_count
            const total = larvaeCount + nymphsCount;
            groupedData[key].count += total;
        });

        // Créer les datasets par secteur
        const datasets = [];
        const colors = this.themeManager.getColorArray(sectors.size);
        let colorIndex = 0;

        Array.from(sectors).forEach(sector => {
            const data = Array.from(months).map(month => {
                const key = Object.keys(groupedData).find(k => 
                    groupedData[k].sector === sector && groupedData[k].period === month
                );
                return key ? groupedData[key].count : 0;
            });

            datasets.push({
                label: sector,
                data: data,
                backgroundColor: this.themeManager.getColorWithAlpha(colors[colorIndex], 0.8),
                borderColor: colors[colorIndex],
                borderWidth: 1
            });
            colorIndex++;
        });

        return {
            labels: this.sortMonthsChronologically(Array.from(months)),
            datasets: datasets
        };
    }

    processAdultsDensityData() {
        if (!this.data.adults || this.data.adults.length === 0) {
            return { labels: [], values: [] };
        }

        // Grouper par mois et sommer total_mosquitoes_count
        const monthlyData = {};
        
        this.data.adults.forEach(item => {
            if (!item.visit_date || !item.total_mosquitoes_count) return;
            
            const date = new Date(item.visit_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = this.getMonthLabel(date);
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { label: monthLabel, count: 0 };
            }
            monthlyData[monthKey].count += parseInt(item.total_mosquitoes_count) || 0;
        });

        // Trier par mois chronologiquement et extraire les données
        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            // Comparer les dates YYYY-MM
            return a.localeCompare(b);
        });
        const labels = sortedMonths.map(key => monthlyData[key].label);
        const values = sortedMonths.map(key => monthlyData[key].count);

        return { labels, values };
    }

    processAdultsSectorData() {
        if (!this.data.adults || this.data.adults.length === 0) {
            return { labels: [], datasets: [] };
        }
        
        // Grouper par secteur et mois
        const groupedData = {};
        const months = new Set();
        const sectors = new Set();

        this.data.adults.forEach(item => {
            if (!item.visit_date || !item.sector || !item.total_mosquitoes_count) return;
            
            const date = new Date(item.visit_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = this.getMonthLabel(date);
            
            // Gérer les secteurs comme string (pas d'array)
            const sector = item.sector;
            if (!sector) return;
            
            months.add(monthLabel);
            sectors.add(sector);
            
            const key = `${sector}_${monthKey}`;
            if (!groupedData[key]) {
                groupedData[key] = { sector: sector, month: monthLabel, count: 0 };
            }
            groupedData[key].count += parseInt(item.total_mosquitoes_count) || 0;
        });

        // Créer les datasets par secteur
        const datasets = [];
        const colors = this.themeManager.getColorArray(sectors.size);
        let colorIndex = 0;

        Array.from(sectors).forEach(sector => {
            const data = Array.from(months).map(month => {
                const key = Object.keys(groupedData).find(k => 
                    groupedData[k].sector === sector && groupedData[k].month === month
                );
                return key ? groupedData[key].count : 0;
            });

            datasets.push({
                label: sector,
                data: data,
                backgroundColor: this.themeManager.getColorWithAlpha(colors[colorIndex], 0.8),
                borderColor: colors[colorIndex],
                borderWidth: 1
            });
            colorIndex++;
        });
        
        return {
            labels: this.sortMonthsChronologically(Array.from(months)),
            datasets: datasets
        };
    }
    
    processAdultsGenusData() {
        if (!this.data.adults || this.data.adults.length === 0) {
            return { labels: ['Aedes', 'Culex', 'Anopheles', 'Autres'], values: [0, 0, 0, 0] };
        }

        // Sommer les colonnes de genre spécifiques
        let aedesCount = 0;
        let culexCount = 0;
        let anophelesCount = 0;
        let otherCount = 0;

        this.data.adults.forEach(item => {
            aedesCount += (item.mosquitoes_aedes_count !== null && item.mosquitoes_aedes_count !== undefined) ? parseInt(item.mosquitoes_aedes_count) || 0 : 0;
            culexCount += (item.mosquitoes_culex_count !== null && item.mosquitoes_culex_count !== undefined) ? parseInt(item.mosquitoes_culex_count) || 0 : 0;
            anophelesCount += (item.mosquitoes_anopheles_count !== null && item.mosquitoes_anopheles_count !== undefined) ? parseInt(item.mosquitoes_anopheles_count) || 0 : 0;
            otherCount += (item.mosquitoes_other_count !== null && item.mosquitoes_other_count !== undefined) ? parseInt(item.mosquitoes_other_count) || 0 : 0;
        });

        return {
            labels: ['Aedes', 'Culex', 'Anopheles', 'Autres'],
            values: [aedesCount, culexCount, anophelesCount, otherCount]
        };
    }

    // Méthode utilitaire pour obtenir le label du mois
    getMonthLabel(date) {
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return months[date.getMonth()];
    }

    // Fonction pour trier les mois français chronologiquement
    sortMonthsChronologically(monthLabels) {
        const monthOrder = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        return monthLabels.sort((a, b) => {
            const indexA = monthOrder.indexOf(a);
            const indexB = monthOrder.indexOf(b);
            return indexA - indexB;
        });
    }

    // Fonction pour trier les mois chronologiquement
    sortPeriodsChronologically(periodLabels) {
        const periodOrder = [
            'Jan-Fév', 'Mar-Avr', 'Mai-Jun', 'Jul-Aoû', 'Sep-Oct', 'Nov-Déc'
        ];
        
        return periodLabels.sort((a, b) => {
            const indexA = periodOrder.indexOf(a);
            const indexB = periodOrder.indexOf(b);
            return indexA - indexB;
        });
    }

    // Méthode utilitaire pour formater les grandes valeurs
    formatLargeValue(value) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return value.toLocaleString();
    }

    // Configuration d'échelle adaptée aux grandes données
    getAdaptiveScaleConfig(label, maxValue) {
        return {
            beginAtZero: true,
                title: {
                    display: true,
                text: label
            },
                    ticks: {
                callback: (value) => this.formatLargeValue(value),
                maxTicksLimit: maxValue > 100000 ? 8 : 10
            }
        };
    }


    showError(message) {
        console.error('❌ Erreur:', message);
        // Afficher un message d'erreur à l'utilisateur
    }

    // ===== Gestion année & bannière archives =====
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
        const select = document.getElementById('year-selection-analyses');
        if (!select) return;
        try {
            const res = await fetch('/api/archive/years');
            const json = await res.json();
            const years = Array.isArray(json.data) ? json.data : [];
            const currentOption = '<option value="current">Année en cours</option>';
            select.innerHTML = currentOption + years.map(y => `<option value="${y}">${y} (archivée)</option>`).join('');
            // Sync valeur
            const value = this.currentYear || 'current';
            select.value = value;
        } catch (e) {
            console.warn('⚠️ Impossible de charger les années archives:', e.message);
        }
    }

    updateArchiveBanner(year, mode) {
        const banner = document.getElementById('archive-banner-analyses');
        const spanYear = document.getElementById('archive-year-analyses');
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

    // Mettre à jour le graphique d'évolution des œufs selon le secteur
    updateEggsEvolutionChart(selectedSector) {
        console.log('🔄 Mise à jour du graphique d\'évolution des œufs pour le secteur:', selectedSector);
        
        if (!this.charts.eggsEvolution) {
            console.error('❌ Graphique eggsEvolution non trouvé');
            return;
        }

        const data = this.processEggsEvolutionData(selectedSector);
        console.log('📊 Données traitées:', data);
        
        this.charts.eggsEvolution.data.labels = data.labels;
        this.charts.eggsEvolution.data.datasets[0].data = data.values;
        
        // Recalculer l'échelle si nécessaire
        if (data.values.length > 0) {
            const maxValue = Math.max(...data.values);
            this.charts.eggsEvolution.options.scales.y = this.getAdaptiveScaleConfig('Nombre d\'œufs', maxValue);
        }
        
        this.charts.eggsEvolution.update();
        console.log('✅ Graphique mis à jour');
    }

    // Mettre à jour le graphique de densité par genre selon le mois
    updateAdultsGenusChart(selectedMonth) {
        if (!this.charts.adultsGenus) return;

        const data = this.processAdultsGenusData(selectedMonth);
        
        this.charts.adultsGenus.data.labels = data.labels;
        this.charts.adultsGenus.data.datasets[0].data = data.values;
        
        this.charts.adultsGenus.update();
    }

    // Traitement des données d'évolution des œufs avec filtre secteur
    processEggsEvolutionData(selectedSector = 'all') {
        if (!this.data.eggs || this.data.eggs.length === 0) {
            return { labels: [], values: [] };
        }

        // Filtrer les données selon le secteur sélectionné
        const filteredData = selectedSector === 'all' 
            ? this.data.eggs 
            : this.data.eggs.filter(item => {
                // Gérer les secteurs comme string simple
                return item.sector === selectedSector;
            });

        // Grouper par mois et sommer eggs_count
        const monthlyData = {};
        
        filteredData.forEach(item => {
            if (!item.visit_date || !item.eggs_count) return;
            
            const date = new Date(item.visit_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = this.getMonthLabel(date);
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { label: monthLabel, count: 0 };
            }
            monthlyData[monthKey].count += parseInt(item.eggs_count) || 0;
        });

        // Trier par mois chronologiquement
        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            // Comparer les dates YYYY-MM
            return a.localeCompare(b);
        });
        
        return {
            labels: sortedMonths.map(key => monthlyData[key].label),
            values: sortedMonths.map(key => monthlyData[key].count)
        };
    }

    // Traitement des données œufs par mois et par milieu
    processEggsMonthEnvironmentData() {
        if (!this.data.eggs || this.data.eggs.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Grouper par mois et milieu, puis sommer eggs_count
        const groupedData = {};
        const months = new Set();
        const environments = new Set();

        this.data.eggs.forEach(item => {
            if (!item.visit_date || !item.environment || !item.eggs_count) return;
            
            const date = new Date(item.visit_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = this.getMonthLabel(date);
            
            const environment = item.environment;
            if (!environment) return;
            
            months.add(monthLabel);
            environments.add(environment);
            
            const key = `${environment}_${monthKey}`;
            if (!groupedData[key]) {
                groupedData[key] = { environment: environment, month: monthLabel, count: 0 };
            }
            groupedData[key].count += parseInt(item.eggs_count) || 0;
        });

        // Créer les datasets par milieu
        const datasets = [];
        const colors = this.themeManager.getColorArray(environments.size);
        let colorIndex = 0;

        // Créer un ordre chronologique des mois basé sur les données réelles
        const allMonths = Array.from(months);
        const sortedMonths = allMonths.sort((a, b) => {
            const monthOrder = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            return monthOrder.indexOf(a) - monthOrder.indexOf(b);
        });

        environments.forEach(environment => {
            const data = [];

            sortedMonths.forEach(monthLabel => {
                // Trouver le monthKey correspondant au monthLabel
                let foundKey = null;
                for (const [key, value] of Object.entries(groupedData)) {
                    if (value.environment === environment && value.month === monthLabel) {
                        foundKey = key;
                        break;
                    }
                }
                data.push(foundKey ? groupedData[foundKey].count : 0);
            });

            datasets.push({
                label: environment === 'urban' ? 'Urbain' : environment === 'rural' ? 'Rural' : environment,
                data: data,
                backgroundColor: colors[colorIndex],
                borderColor: colors[colorIndex],
                borderWidth: 1
            });
            colorIndex++;
        });

        return {
            labels: sortedMonths,
            datasets: datasets
        };
    }

    // Traitement des données de types de gîtes par milieu
    processSiteTypeEnvironmentData() {
        if (!this.data.larvae || this.data.larvae.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Grouper par type de gîte et milieu
        const groupedData = {};
        const siteTypes = new Set();
        const environments = new Set();

        this.data.larvae.forEach(item => {
            if (!item.site_classes || !item.environment || !item.total_sites_count) return;
            
            const environment = item.environment;
            if (!environment) return;
            
            // Traiter les classes de gîtes (array)
            let siteClasses = item.site_classes;
            if (typeof siteClasses === 'string') {
                try {
                    siteClasses = JSON.parse(siteClasses);
                } catch (e) {
                    siteClasses = [siteClasses];
                }
            }
            
            if (!Array.isArray(siteClasses)) return;
            
            environments.add(environment);
            
            siteClasses.forEach(siteClass => {
                if (!siteClass) return;
                
                siteTypes.add(siteClass);
                
                const key = `${siteClass}_${environment}`;
                if (!groupedData[key]) {
                    groupedData[key] = { siteType: siteClass, environment: environment, count: 0 };
                }
                groupedData[key].count += parseInt(item.total_sites_count) || 0;
            });
        });

        // Créer les datasets par type de gîte
        const datasets = [];
        const colors = this.themeManager.getColorArray(siteTypes.size);
        let colorIndex = 0;

        // Créer un ordre des environnements
        const sortedEnvironments = Array.from(environments).sort();

        siteTypes.forEach(siteType => {
            const data = [];

            sortedEnvironments.forEach(environment => {
                const key = `${siteType}_${environment}`;
                data.push(groupedData[key] ? groupedData[key].count : 0);
            });

            datasets.push({
                label: siteType,
                data: data,
                backgroundColor: colors[colorIndex],
                borderColor: colors[colorIndex],
                borderWidth: 1
            });
            colorIndex++;
        });

        return {
            labels: sortedEnvironments,
            datasets: datasets
        };
    }

    // Traitement des données d'Aedes par méthode de collecte et lieu de capture
    processAedesMethodLocationData() {
        if (!this.data.adults || this.data.adults.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Grouper par méthode de collecte et lieu de capture
        const groupedData = {};
        const methods = new Set();
        const locations = new Set();

        this.data.adults.forEach(item => {
            if (!item.collection_methods || !item.capture_locations || !item.mosquitoes_aedes_count) return;
            
            const method = item.collection_methods;
            const location = item.capture_locations;
            if (!method || !location) return;
            
            methods.add(method);
            locations.add(location);
            
            const key = `${method}_${location}`;
            if (!groupedData[key]) {
                groupedData[key] = { method: method, location: location, count: 0 };
            }
            groupedData[key].count += parseInt(item.mosquitoes_aedes_count) || 0;
        });

        // Créer les datasets par méthode de collecte
        const datasets = [];
        const colors = this.themeManager.getColorArray(methods.size);
        let colorIndex = 0;

        // Créer un ordre des lieux de capture
        const sortedLocations = Array.from(locations).sort();

        methods.forEach(method => {
            const data = [];

            sortedLocations.forEach(location => {
                const key = `${method}_${location}`;
                data.push(groupedData[key] ? groupedData[key].count : 0);
            });

            datasets.push({
                label: method,
                data: data,
                backgroundColor: colors[colorIndex],
                borderColor: colors[colorIndex],
                borderWidth: 1
            });
            colorIndex++;
        });

        return {
            labels: sortedLocations,
            datasets: datasets
        };
    }

    // Traitement des données de gîtes par secteur et par mois
    processSitesSectorMonthData() {
        if (!this.data.larvae || this.data.larvae.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Grouper par secteur et mois, puis sommer total_sites_count
        const groupedData = {};
        const months = new Set();
        const sectors = new Set();

        this.data.larvae.forEach(item => {
            if (!item.visit_date || !item.sector || !item.total_sites_count) return;
            
            const date = new Date(item.visit_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = this.getMonthLabel(date);
            
            const sector = item.sector;
            if (!sector) return;
            
            months.add(monthLabel);
            sectors.add(sector);
            
            const key = `${sector}_${monthKey}`;
            if (!groupedData[key]) {
                groupedData[key] = { sector: sector, month: monthLabel, count: 0 };
            }
            groupedData[key].count += parseInt(item.total_sites_count) || 0;
        });

        // Créer les datasets par secteur
        const datasets = [];
        const colors = this.themeManager.getColorArray(sectors.size);
        let colorIndex = 0;

        // Créer un ordre chronologique des mois basé sur les données réelles
        const allMonths = Array.from(months);
        const sortedMonths = allMonths.sort((a, b) => {
            const monthOrder = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            return monthOrder.indexOf(a) - monthOrder.indexOf(b);
        });

        sectors.forEach(sector => {
            const data = [];

            sortedMonths.forEach(monthLabel => {
                // Trouver le monthKey correspondant au monthLabel
                let foundKey = null;
                for (const [key, value] of Object.entries(groupedData)) {
                    if (value.sector === sector && value.month === monthLabel) {
                        foundKey = key;
                        break;
                    }
                }
                data.push(foundKey ? groupedData[foundKey].count : 0);
            });

            datasets.push({
                label: sector,
                data: data,
                backgroundColor: colors[colorIndex],
                borderColor: colors[colorIndex],
                borderWidth: 1
            });
            colorIndex++;
        });

        return {
            labels: sortedMonths,
            datasets: datasets
        };
    }

    // Traitement des données d'Aedes par secteur et par mois
    processAedesSectorMonthData() {
        if (!this.data.adults || this.data.adults.length === 0) {
            return { labels: [], datasets: [] };
        }

        // Grouper par secteur et mois, puis sommer mosquitoes_aedes_count
        const groupedData = {};
        const months = new Set();
        const sectors = new Set();

        this.data.adults.forEach(item => {
            if (!item.visit_date || !item.sector || !item.mosquitoes_aedes_count) return;
            
            const date = new Date(item.visit_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = this.getMonthLabel(date);
            
            const sector = item.sector;
            if (!sector) return;
            
            months.add(monthLabel);
            sectors.add(sector);
            
            const key = `${sector}_${monthKey}`;
            if (!groupedData[key]) {
                groupedData[key] = { sector: sector, month: monthLabel, count: 0 };
            }
            groupedData[key].count += parseInt(item.mosquitoes_aedes_count) || 0;
        });

        // Créer les datasets par secteur
        const datasets = [];
        const colors = this.themeManager.getColorArray(sectors.size);
        let colorIndex = 0;

        // Créer un ordre chronologique des mois basé sur les données réelles
        const allMonths = Array.from(months);
        const sortedMonths = allMonths.sort((a, b) => {
            const monthOrder = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            return monthOrder.indexOf(a) - monthOrder.indexOf(b);
        });

        sectors.forEach(sector => {
            const data = [];

            sortedMonths.forEach(monthLabel => {
                // Trouver le monthKey correspondant au monthLabel
                let foundKey = null;
                for (const [key, value] of Object.entries(groupedData)) {
                    if (value.sector === sector && value.month === monthLabel) {
                        foundKey = key;
                        break;
                    }
                }
                data.push(foundKey ? groupedData[foundKey].count : 0);
            });

            datasets.push({
                label: sector,
                data: data,
                backgroundColor: colors[colorIndex],
                borderColor: colors[colorIndex],
                borderWidth: 1
            });
            colorIndex++;
        });

        return {
            labels: sortedMonths,
            datasets: datasets
        };
    }

    // Traitement des données de densité par genre avec filtre mois
    processAdultsGenusData(selectedMonth = 'all') {
        if (!this.data.adults || this.data.adults.length === 0) {
            return { labels: ['Aedes', 'Culex', 'Anopheles', 'Autres'], values: [0, 0, 0, 0] };
        }

        // Filtrer les données selon le mois sélectionné
        const filteredData = selectedMonth === 'all' 
            ? this.data.adults 
            : this.data.adults.filter(item => {
                const date = new Date(item.visit_date);
                return this.getMonthLabel(date) === selectedMonth;
            });

        // Sommer les colonnes de genre
        let aedesCount = 0;
        let culexCount = 0;
        let anophelesCount = 0;
        let otherCount = 0;

        filteredData.forEach(item => {
            aedesCount += (item.mosquitoes_aedes_count !== null && item.mosquitoes_aedes_count !== undefined) ? parseInt(item.mosquitoes_aedes_count) || 0 : 0;
            culexCount += (item.mosquitoes_culex_count !== null && item.mosquitoes_culex_count !== undefined) ? parseInt(item.mosquitoes_culex_count) || 0 : 0;
            anophelesCount += (item.mosquitoes_anopheles_count !== null && item.mosquitoes_anopheles_count !== undefined) ? parseInt(item.mosquitoes_anopheles_count) || 0 : 0;
            otherCount += (item.mosquitoes_other_count !== null && item.mosquitoes_other_count !== undefined) ? parseInt(item.mosquitoes_other_count) || 0 : 0;
        });

        return {
            labels: ['Aedes', 'Culex', 'Anopheles', 'Autres'],
            values: [aedesCount, culexCount, anophelesCount, otherCount]
        };
    }
}

// Initialisation quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Initialisation de la page analyses...');
    window.analysesManager = new AnalysesManager();
});
