// =====================================================
// GRAPHIQUE INDÉPENDANT - ŒUFS PAR SECTEUR
// Centre MURAZ - Utilise les vraies données des tables
// =====================================================

class OeufsSecteurChartIndependent {
    constructor(containerId = 'oeufs-secteur-chart') {
        this.containerId = containerId;
        this.chartName = 'Œufs par Secteur (Indépendant)';
        this.chart = null;
        this.data = null;
        this.isInitialized = false;
        this.errorMessage = null;
        this.selectedMonth = '';

        console.log(`🚀 Initialisation ${this.chartName} (${this.containerId})`);
    }

    async init() {
        try {
            console.log(`📊 Chargement des données pour ${this.chartName}...`);
            await this.loadData();
            this.createChart();
            this.setupEventListeners();

            // Forcer la création de la légende avec un délai
            setTimeout(() => {
                this.updateLegend();
                console.log('📊 Légende forcée après délai');
            }, 500);

            this.isInitialized = true;
            console.log(`✅ ${this.chartName} initialisé avec succès`);
        } catch (error) {
            console.error(`❌ Erreur ${this.chartName}:`, error);
            this.showError(`Erreur lors du chargement de ${this.chartName}: ${error.message}`);
        }
    }

    async loadData() {
        console.log('🥚 Appel API spécifique pour les œufs...');
        const response = await fetch('/api/analyses/oeufs');

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Erreur lors du chargement des données œufs');
        }

        this.data = result.data;
        console.log(`📊 Données œufs chargées:`, {
            totalOeufs: this.data.totalOeufs,
            secteurs: this.data.secteurs,
            periodes: this.data.periodes.length,
            enregistrements: this.data.totalEnregistrements
        });
    }

    createChart() {
        const ctx = document.getElementById(this.containerId);
        if (!ctx) {
            throw new Error(`Container ${this.containerId} non trouvé`);
        }

        this.chart = new Chart(ctx, {
            type: 'bar',
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

    prepareData() {
        if (!this.data?.chartData?.oeufsParSecteur) {
            console.warn('⚠️ Données manquantes pour le graphique œufs par secteur');
            return { labels: [], datasets: [] };
        }

        const secteurs = this.data.secteurs || [];
        const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444']; // Couleurs MURAZ

        if (this.selectedMonth) {
            // Données pour le mois sélectionné
            const data = secteurs.map(secteur => {
                return this.data.chartData.oeufsParPeriode[this.selectedMonth]?.[secteur] || 0;
            });

            return {
                labels: secteurs,
                datasets: [{
                    label: `Œufs - ${this.selectedMonth}`,
                    data: data,
                    backgroundColor: colors.slice(0, secteurs.length).map(color => color + '80'),
                    borderColor: colors.slice(0, secteurs.length),
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            };
        } else {
            // Total de tous les mois
            const data = secteurs.map(secteur => {
                return this.data.chartData.oeufsParSecteur[secteur] || 0;
            });

            return {
                labels: secteurs,
                datasets: [{
                    label: 'Œufs (total)',
                    data: data,
                    backgroundColor: colors.slice(0, secteurs.length).map(color => color + '80'),
                    borderColor: colors.slice(0, secteurs.length),
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false
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
                    text: 'Distribution des Œufs par Secteur',
                    font: { size: 16, weight: 'bold' },
                    color: '#f59e0b'
                },
                legend: {
                    display: false, // Désactiver la légende automatique car elle n'est pas utile ici
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#f59e0b',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return `Secteur: ${context[0].label}`;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const secteur = context.label;
                            const periode = context.dataset.label.includes('total') ? 'Toutes périodes' : context.dataset.label.replace('Œufs - ', '');
                            return `${periode}: ${value.toLocaleString()} œufs`;
                        },
                        afterLabel: function(context) {
                            const secteur = context.label;
                            const secteurNames = {
                                'Sector 6': 'Secteur 6',
                                'Sector 9': 'Secteur 9',
                                'Sector 26': 'Secteur 26',
                                'Sector 33': 'Secteur 33'
                            };
                            return secteurNames[secteur] || secteur;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 12 }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        font: { size: 12 },
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
                            return value.toLocaleString();
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        };
    }

    setupEventListeners() {
        const moisSelect = document.getElementById('mois-oeufs-secteur');
        if (moisSelect) {
            this.populateMonthSelector(moisSelect);
            moisSelect.addEventListener('change', (e) => {
                this.selectedMonth = e.target.value;
                console.log(`📅 Mois sélectionné: ${this.selectedMonth}`);
                this.updateChart();
                this.updateLegend(); // Mettre à jour la légende
            });
        }

        // Générer la légende initiale
        this.updateLegend();
    }

    updateLegend() {
        const legendContainer = document.getElementById('oeufs-secteur-legend');
        if (!legendContainer) {
            console.warn('⚠️ Container de légende non trouvé: oeufs-secteur-legend');
            return;
        }

        console.log('📊 Données disponibles:', this.data);

        // Utiliser les secteurs disponibles ou les secteurs par défaut
        const secteurs = this.data?.secteurs || ['Sector 6', 'Sector 9', 'Sector 26', 'Sector 33'];
        const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444']; // Couleurs MURAZ
        const secteurNames = {
            'Sector 6': 'Secteur 6',
            'Sector 9': 'Secteur 9',
            'Sector 26': 'Secteur 26',
            'Sector 33': 'Secteur 33'
        };

        console.log('📊 Création de la légende avec les secteurs:', secteurs);

        legendContainer.innerHTML = '';

        secteurs.forEach((secteur, index) => {
            const color = colors[index % colors.length];
            const secteurName = secteurNames[secteur] || secteur;
            const totalOeufs = this.data?.chartData?.oeufsParSecteur?.[secteur] || 0;

            const legendItem = document.createElement('div');
            legendItem.className = 'flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg';
            legendItem.innerHTML = `
                <div class="w-4 h-4 rounded" style="background-color: ${color}"></div>
                <span class="font-medium text-gray-700">${secteurName}</span>
                <span class="text-gray-500">(${totalOeufs.toLocaleString()} œufs)</span>
            `;

            legendContainer.appendChild(legendItem);
        });

        console.log('📊 Légende créée avec', secteurs.length, 'secteurs');
    }

    populateMonthSelector(selectElement) {
        if (!this.data?.periodes) {
            console.warn('⚠️ Aucune période disponible pour le sélecteur');
            return;
        }

        selectElement.innerHTML = '<option value="">Tous les mois</option>';

        this.data.periodes.forEach(periode => {
            const option = document.createElement('option');
            option.value = periode;
            option.textContent = periode;
            selectElement.appendChild(option);
        });

        console.log(`📅 Sélecteur de mois peuplé avec ${this.data.periodes.length} périodes`);
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
                <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg class="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-medium text-red-800">Erreur ${this.chartName}</h3>
                            <div class="mt-2 text-sm text-red-700">${message}</div>
                            <div class="mt-4">
                                <button onclick="location.reload()" class="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium">
                                    Recharger la page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Méthode pour obtenir des statistiques détaillées
    getStatistics() {
        if (!this.data) return null;
        
        return {
            totalOeufs: this.data.totalOeufs,
            secteurs: this.data.secteurs,
            periodes: this.data.periodes,
            totalEnregistrements: this.data.totalEnregistrements
        };
    }
}

// =====================================================
// INITIALISATION GÉRÉE PAR LE GESTIONNAIRE PRINCIPAL
// =====================================================
// L'initialisation est maintenant gérée par AnalysesChartManager dans analyses.js
// pour éviter les conflits de double initialisation

// Fonction utilitaire pour afficher les erreurs

