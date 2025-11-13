// Fonction de traduction pour les analyses
function getTranslation(key, fallback) {
    if (window.murazI18n && window.murazI18n.isInitialized()) {
        return window.murazI18n.t(key, fallback);
    }
    return fallback;
}

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
            indicator.textContent = getTranslation('analyses.theme.indicator', 'Couleurs légères');
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
            // Charger les années
            await this.populateYearSelector();

            // Préparer paramètre year
            const query = this.currentYear && this.currentYear !== 'current' ? `?year=${encodeURIComponent(this.currentYear)}` : '';

            // Essayer les endpoints agrégés (perf)
            try {
                const [eggsAgg, breedingAgg, mosquitoesAgg, breedingByClass] = await Promise.all([
                    fetch(`/api/analyses/eggs-aggregates${query}`).then(r => r.json()),
                    fetch(`/api/analyses/breeding-aggregates${query}`).then(r => r.json()),
                    fetch(`/api/analyses/mosquitoes-aggregates${query}`).then(r => r.json()),
                    fetch(`/api/analyses/breeding-by-class-environment${query}`).then(r => r.json())
                ]);

                if (eggsAgg.success && breedingAgg.success && mosquitoesAgg.success && breedingByClass.success) {
                    // Mettre à jour bannière archive d'après un des résultats
                    this.updateArchiveBanner(eggsAgg.year || breedingAgg.year || mosquitoesAgg.year, eggsAgg.mode || breedingAgg.mode || mosquitoesAgg.mode);

                    const eggsData = (eggsAgg.data || []).map(row => ({
                        // Convertir period YYYY-MM en date (1er du mois)
                        visit_date: this.periodToDate(row.period),
                        sector: row.sector,
                        environment: row.environment,
                        eggs_count: Number(row.total_eggs) || 0,
                        observations: null,
                        submitted_at: null
                    }));

                    const larvaeData = (breedingAgg.data || []).map(row => ({
                        visit_date: this.periodToDate(row.period),
                        sector: row.sector,
                        environment: row.environment,
                        total_sites_count: Number(row.total_sites) || 0,
                        larvae_count: Number(row.total_larvae) || 0,
                        nymphs_count: Number(row.total_nymphs) || 0,
                        observations: null,
                        submitted_at: null
                    }));

                    const adultsData = (mosquitoesAgg.data || []).map(row => ({
                        visit_date: this.periodToDate(row.period),
                        sector: row.sector,
                        environment: row.environment,
                        collection_methods: row.collection_methods,
                        capture_locations: row.capture_locations,
                        total_mosquitoes_count: Number(row.total_mosquitoes) || 0,
                        mosquitoes_aedes_count: Number(row.total_aedes) || 0,
                        mosquitoes_culex_count: Number(row.total_culex) || 0,
                        mosquitoes_anopheles_count: Number(row.total_anopheles) || 0,
                        mosquitoes_other_count: Number(row.total_other) || 0,
                        observations: null,
                        submitted_at: null
                    }));

                    // Stocker les données breedingByClass
                    const breedingByClassData = breedingByClass.data || [];

                    this.data = { 
                        eggs: eggsData, 
                        larvae: larvaeData, 
                        adults: adultsData,
                        breedingByClass: breedingByClassData
                    };
                    // Ajouter les années détectées dans les données si pas d'archives
                    this.populateYearSelectorFromData();

                    console.log('✅ Données agrégées chargées:', {
                        eggs: eggsData.length,
                        larvae: larvaeData.length,
                        adults: adultsData.length,
                        breedingByClass: breedingByClassData.length
                    });

                    // Initialiser les filtres
                    this.initializeFilters();
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Échec chargement agrégés, bascule sur endpoints détaillés:', e.message);
            }

            // Fallback: endpoints détaillés existants
            const [eggsData, larvaeData, adultsData] = await Promise.all([
                this.fetchEggsData(),
                this.fetchLarvaeData(),
                this.fetchAdultsData()
            ]);
            this.data = { eggs: eggsData, larvae: larvaeData, adults: adultsData };
            // Ajouter les années détectées dans les données si pas d'archives
            this.populateYearSelectorFromData();
            console.log('✅ Données (fallback) chargées:', {
                eggs: eggsData?.length || 0,
                larvae: larvaeData?.length || 0,
                adults: adultsData?.length || 0
            });
            this.initializeFilters();

        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    periodToDate(period) {
        // period: 'YYYY-MM' -> ISO date string 'YYYY-MM-01'
        if (!period || typeof period !== 'string' || !/^[0-9]{4}-[0-9]{2}$/.test(period)) return null;
        return `${period}-01`;
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
        sectorFilter.innerHTML = `<option value="all">${getTranslation('analyses.controls.all_sectors', 'Tous les secteurs')}</option>`;
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
        monthFilter.innerHTML = `<option value="all">${getTranslation('analyses.controls.all_months', 'Tous les mois')}</option>`;
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
                        text: getTranslation('analyses.charts.eggs_sector_month.title', 'Nombre d\'œufs par secteur et par mois'),
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
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} ${getTranslation('analyses.tooltips.eggs', 'œufs')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig(getTranslation('analyses.chart_labels.eggs_count', 'Nombre d\'œufs'), maxValue),
                    x: {
                        title: {
                            display: true,
                            text: getTranslation('analyses.chart_labels.months', 'Mois')
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
                    label: getTranslation('analyses.chart_labels.total_eggs', 'Total œufs collectés'),
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
                        text: getTranslation('analyses.charts.eggs_evolution.title', 'Évolution du nombre total d\'œufs collectés dans l\'année'),
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
                    y: this.getAdaptiveScaleConfig(getTranslation('analyses.chart_labels.eggs_count', 'Nombre d\'œufs'), maxValue),
                    x: {
                        title: {
                            display: true,
                            text: getTranslation('analyses.chart_labels.months', 'Mois')
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
                        text: getTranslation('analyses.charts.eggs_month_environment.title', 'Nombre d\'œufs par mois et par milieu'),
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
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} ${getTranslation('analyses.tooltips.eggs', 'œufs')}`;
                            }
                        }
                }
            },
            scales: {
                    y: this.getAdaptiveScaleConfig(getTranslation('analyses.chart_labels.eggs_count', 'Nombre d\'œufs'), maxValue),
                    x: {
                        title: {
                            display: true,
                            text: getTranslation('analyses.chart_labels.months', 'Mois')
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
                        text: getTranslation('analyses.charts.larvae_sector.title', 'Nombre total de larves et nymphes par mois par secteur'),
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
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} ${getTranslation('analyses.tooltips.larvae', 'larves + nymphes')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig(getTranslation('analyses.chart_labels.larvae_count', 'Nombre de larves + nymphes'), maxValue),
                    x: {
                        title: {
                            display: true,
                            text: getTranslation('analyses.chart_labels.months', 'Mois')
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
                        text: getTranslation('analyses.charts.sites_sector_month.title', 'Nombre de gîtes par secteur par mois'),
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
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} ${getTranslation('analyses.tooltips.sites', 'gîtes')}`;
                            }
                        }
                }
            },
            scales: {
                    y: this.getAdaptiveScaleConfig(getTranslation('analyses.chart_labels.sites_count', 'Nombre de gîtes'), maxValue),
                    x: {
                        title: {
                            display: true,
                            text: getTranslation('analyses.chart_labels.months', 'Mois')
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
                        text: getTranslation('analyses.charts.aedes_sector_month.title', 'Nombre d\'Aedes par secteur et par mois'),
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
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} ${getTranslation('analyses.tooltips.aedes', 'Aedes')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig(getTranslation('analyses.chart_labels.aedes_count', 'Nombre d\'Aedes'), maxValue),
                    x: {
                        title: {
                            display: true,
                            text: getTranslation('analyses.chart_labels.months', 'Mois')
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
                        text: getTranslation('analyses.charts.site_type_environment.title', 'Quantité par classe de gîtes selon le milieu'),
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
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} ${getTranslation('analyses.tooltips.sites', 'gîtes')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig(getTranslation('analyses.chart_labels.sites_count', 'Nombre de gîtes'), maxValue),
                    x: {
                        title: {
                            display: true,
                            text: getTranslation('analyses.chart_labels.milieu', 'Milieu')
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
                        text: getTranslation('analyses.charts.aedes_method_location.title', 'Nombre d\'Aedes par méthode de collecte et lieu de capture'),
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
                                return `${context.dataset.label}: ${this.formatLargeValue(value)} ${getTranslation('analyses.tooltips.aedes', 'Aedes')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: this.getAdaptiveScaleConfig(getTranslation('analyses.chart_labels.aedes_count', 'Nombre d\'Aedes'), maxValue),
                    x: {
                        title: {
                            display: true,
                            text: getTranslation('analyses.chart_labels.capture_location', 'Lieu de capture')
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
                        text: getTranslation('analyses.charts.adults_density.title', 'Courbe du nombre total ou densité/an des moustiques adultes'),
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
                            text: getTranslation('analyses.chart_labels.months', 'Mois')
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
                        text: getTranslation('analyses.charts.adults_sector.title', 'Densité par secteur par mois'),
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
                            text: getTranslation('analyses.chart_labels.months', 'Mois')
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
                        text: getTranslation('analyses.charts.adults_genus.title', 'Densité par genre'),
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

        const labels = this.getEnglishMonthNames();
        return {
            labels: labels,
            datasets: datasets.map(ds => ({
                ...ds,
                data: labels.map(month => {
                    // Remapper les données sur les 12 mois fixes (Jan -> Dec)
                    const key = Object.keys(groupedData).find(k => groupedData[k].sector === ds.label && groupedData[k].month === month);
                    return key ? groupedData[key].count : 0;
                })
            }))
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

        // Remplir tous les mois de Janvier à Décembre (zéro si absent)
        const labels = this.getEnglishMonthNames();
        const totalsByLabel = {};
        Object.keys(monthlyData).forEach(key => {
            const label = monthlyData[key].label;
            totalsByLabel[label] = (totalsByLabel[label] || 0) + monthlyData[key].count;
        });
        const values = labels.map(label => totalsByLabel[label] || 0);

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

        const labels = this.getEnglishMonthNames();
        Array.from(sectors).forEach(sector => {
            const data = labels.map(month => {
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
            labels: labels,
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

    // Méthode utilitaire pour obtenir le label du mois (toujours en anglais pour les graphiques)
    getMonthLabel(date) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[date.getMonth()];
    }

    // Retourne la liste complète des mois (anglais) de Janvier à Décembre
    getEnglishMonthNames() {
        return [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
    }

    // Fonction pour trier les mois anglais chronologiquement
    sortMonthsChronologically(monthLabels) {
        const monthOrder = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        return monthLabels.sort((a, b) => {
            const indexA = monthOrder.indexOf(a);
            const indexB = monthOrder.indexOf(b);
            return indexA - indexB;
        });
    }

    // Fonction pour trier les mois français chronologiquement
    sortMonthsChronologicallyFrench(monthLabels) {
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

    // Ajoute les années détectées dans les données actuelles (fallback si pas d'archives)
    populateYearSelectorFromData() {
        const select = document.getElementById('year-selection-analyses');
        if (!select) return;

        const extractYears = (arr = [], field) => {
            const out = new Set();
            arr.forEach(item => {
                const v = item?.[field];
                if (!v) return;
                const d = new Date(v);
                if (!isNaN(d.getTime())) out.add(String(d.getFullYear()))
            });
            return out;
        };

        const years = new Set();
        // visit_date présent dans eggs/larvae/adults (normalisé au 1er du mois pour agrégats)
        extractYears(this.data?.eggs, 'visit_date').forEach(y => years.add(y));
        extractYears(this.data?.larvae, 'visit_date').forEach(y => years.add(y));
        extractYears(this.data?.adults, 'visit_date').forEach(y => years.add(y));

        if (years.size === 0) return;

        // Options existantes pour éviter les doublons
        const existing = new Set(Array.from(select.options).map(o => o.value));
        const sorted = Array.from(years).sort((a,b) => parseInt(b) - parseInt(a));

        // S'assurer que "current" existe
        if (!existing.has('current')) {
            const opt = document.createElement('option');
            opt.value = 'current';
            opt.textContent = 'Année en cours';
            select.appendChild(opt);
            existing.add('current');
        }

        sorted.forEach(y => {
            if (!existing.has(y)) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                select.appendChild(opt);
            }
        });

        // Synchroniser la valeur visible
        const value = this.currentYear || 'current';
        if (select.value !== value) select.value = value;
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

        // Remplir tous les mois de Janvier à Décembre (zéro si absent)
        const labels = this.getEnglishMonthNames();
        const totalsByLabel = {};
        Object.keys(monthlyData).forEach(key => {
            const label = monthlyData[key].label;
            totalsByLabel[label] = (totalsByLabel[label] || 0) + monthlyData[key].count;
        });
        return {
            labels,
            values: labels.map(label => totalsByLabel[label] || 0)
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

        // Créer un ordre fixe Janvier -> Décembre
        const allMonths = this.getEnglishMonthNames();
        const sortedMonths = allMonths;

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
        console.log('🔍 Debug processSiteTypeEnvironmentData - Données disponibles:', this.data.breedingByClass?.length || 0);
        
        if (!this.data.breedingByClass || this.data.breedingByClass.length === 0) {
            console.log('⚠️ Aucune donnée breedingByClass disponible');
            return { labels: [], datasets: [] };
        }

        // Debug: afficher la structure des premières données
        console.log('📊 Première donnée breedingByClass:', this.data.breedingByClass[0]);

        // Collecter les classes de gîtes et environnements uniques
        const siteClasses = new Set();
        const environments = new Set();
        
        this.data.breedingByClass.forEach(item => {
            if (item.site_class) siteClasses.add(item.site_class);
            if (item.environment) environments.add(item.environment);
        });

        // Convertir en arrays et trier
        const siteClassesArray = Array.from(siteClasses).sort();
        const environmentsArray = Array.from(environments).sort();

        console.log('📋 Classes de gîtes:', siteClassesArray);
        console.log('📋 Environnements:', environmentsArray);

        // Créer les datasets par classe de gîte
        const colors = this.themeManager.getColorArray(siteClassesArray.length);
        const datasets = siteClassesArray.map((siteClass, index) => {
            const data = environmentsArray.map(environment => {
                const item = this.data.breedingByClass.find(
                    d => d.site_class === siteClass && d.environment === environment
                );
                return item ? (Number(item.total_sites) || 0) : 0;
            });

            return {
                label: siteClass,
                data: data,
                backgroundColor: colors[index],
                borderColor: colors[index],
                borderWidth: 1
            };
        });

        // Labels = environnements (urban, rural)
        const labels = environmentsArray;

        console.log('📊 Datasets créés:', datasets.length);
        console.log('🏷️ Labels:', labels);

        return {
            labels: labels,
            datasets: datasets
        };
    }

    // Traitement des données d'Aedes par méthode de collecte et lieu de capture
    processAedesMethodLocationData() {
        console.log('🔍 Debug processAedesMethodLocationData - Données adultes:', this.data.adults?.length || 0);
        
        if (!this.data.adults || this.data.adults.length === 0) {
            console.log('⚠️ Aucune donnée adultes disponible');
            return { labels: [], datasets: [] };
        }

        // Debug: afficher la première donnée
        console.log('📊 Première donnée adultes:', this.data.adults[0]);

        // Grouper par méthode de collecte et lieu de capture
        const groupedData = {};
        const methods = new Set();
        const locations = new Set();

        this.data.adults.forEach(item => {
            if (!item.collection_methods || !item.capture_locations || !item.mosquitoes_aedes_count) return;
            
            // ✅ Maintenant chaque ligne a UNE SEULE méthode et UN SEUL lieu
            const method = item.collection_methods;
            const location = item.capture_locations;
            
            methods.add(method);
            locations.add(location);
            
            const key = `${method}_${location}`;
            if (!groupedData[key]) {
                groupedData[key] = { method: method, location: location, count: 0 };
            }
            groupedData[key].count += parseInt(item.mosquitoes_aedes_count) || 0;
        });

        console.log('📋 Méthodes trouvées:', Array.from(methods));
        console.log('📋 Locations trouvées:', Array.from(locations));
        console.log('📊 Données groupées:', Object.keys(groupedData).length, 'combinaisons');

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

        console.log('✅ Datasets créés:', datasets.length);
        console.log('🏷️ Labels:', sortedLocations);

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
        const sortedMonths = this.sortMonthsChronologicallyFrench(allMonths);

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
        const sortedMonths = this.sortMonthsChronologicallyFrench(allMonths);

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

    // Toggle menu mobile
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const mainNav = document.getElementById('main-nav');
    const mobileItems = document.getElementById('mobile-menu-items');
    if (btn && menu) {
        btn.addEventListener('click', () => {
            const isHidden = menu.classList.contains('hidden');
            if (isHidden) {
                // Cloner les éléments de nav dans le menu mobile
                if (mainNav && mobileItems) {
                    mobileItems.innerHTML = '';
                    const links = mainNav.querySelectorAll('a, button');
                    links.forEach(node => {
                        const clone = node.cloneNode(true);
                        clone.classList.remove('mx-2');
                        clone.classList.add('block');
                        mobileItems.appendChild(clone);
                    });
                }
                menu.classList.remove('hidden');
            } else {
                menu.classList.add('hidden');
            }
        });
    }
});
