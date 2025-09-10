// =====================================================
// GRAPHIQUE INDÉPENDANT - ŒUFS PAR MOIS (COURBE)
// Centre MURAZ - Utilise les vraies données des tables
// =====================================================

class OeufsMoisChartIndependent {
    constructor(containerId = 'oeufs-mois-chart') {
        this.containerId = containerId;
        this.chartName = 'Œufs par Mois (Indépendant)';
        this.chart = null;
        this.data = null;
        this.isInitialized = false;
        this.errorMessage = null;

        console.log(`🚀 Initialisation ${this.chartName} (${this.containerId})`);
    }

    async init() {
        try {
            console.log(`📊 Chargement des données pour ${this.chartName}...`);

            // Créer la légende personnalisée
            const container = document.getElementById(this.containerId);
            if (container) {
                this.createCustomLegend(container);
            }

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
        console.log('📅 Appel API spécifique pour les œufs par mois...');
        const response = await fetch('/api/analyses/oeufs-mois');

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Erreur lors du chargement des données œufs par mois');
        }

        this.data = result.data;
        console.log(`📊 Données œufs par mois chargées:`, {
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
            type: 'line',
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
        if (!this.data?.chartData?.evolutionParSecteur) {
            console.warn('⚠️ Données manquantes pour le graphique œufs par mois');
            return { labels: [], datasets: [] };
        }

        const periodes = this.data.periodes || [];
        const secteurs = this.data.secteurs || [];
        // Couleurs distinctes et contrastées pour chaque secteur
        const colors = [
            '#e74c3c', // Rouge vif - Sector 6
            '#2ecc71', // Vert émeraude - Sector 9
            '#3498db', // Bleu royal - Sector 26
            '#f39c12'  // Orange vif - Sector 33
        ];

        const datasets = secteurs.map((secteur, index) => {
            const secteurData = this.data.chartData.evolutionParSecteur[secteur] || [];
            const rawData = periodes.map(periode => {
                const periodeData = secteurData.find(d => d.periode === periode);
                return periodeData ? periodeData.total : 0;
            });

            // Appliquer un lissage simple (moyenne mobile sur 3 points)
            const data = this.smoothData(rawData);

            return {
                label: secteur, // Label clair pour la légende
                data: data,
                backgroundColor: colors[index % colors.length] + '20',
                borderColor: colors[index % colors.length],
                borderWidth: 4, // Augmenté pour plus de visibilité
                fill: false,
                tension: 0.4, // Courbes lisses
                pointBackgroundColor: colors[index % colors.length],
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3, // Augmenté pour plus de contraste
                pointRadius: 6, // Augmenté pour plus de visibilité
                pointHoverRadius: 8, // Augmenté pour l'interaction
                pointStyle: 'circle' // Style de point uniforme
            };
        });

        return {
            labels: periodes,
            datasets: datasets
        };
    }

    // Créer une légende personnalisée HTML
    createCustomLegend(container) {
        const legendContainer = document.createElement('div');
        legendContainer.id = `${this.containerId}-legend`;
        legendContainer.className = 'chart-legend';
        legendContainer.style.cssText = `
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        `;

        const colors = [
            { color: '#e74c3c', name: 'Secteur 6' },
            { color: '#2ecc71', name: 'Secteur 9' },
            { color: '#3498db', name: 'Secteur 26' },
            { color: '#f39c12', name: 'Secteur 33' }
        ];

        colors.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: bold;
                color: #333;
            `;

            const colorBox = document.createElement('div');
            colorBox.style.cssText = `
                width: 20px;
                height: 20px;
                background-color: ${item.color};
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;

            const label = document.createElement('span');
            label.textContent = item.name;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legendContainer.appendChild(legendItem);
        });

        container.appendChild(legendContainer);
    }

    // Méthode pour lisser les données (moyenne mobile)
    smoothData(data) {
        if (data.length < 3) return data;

        const smoothed = [...data];

        // Lissage des points intérieurs (moyenne mobile sur 3 points)
        for (let i = 1; i < data.length - 1; i++) {
            smoothed[i] = Math.round((data[i-1] + data[i] + data[i+1]) / 3);
        }

        return smoothed;
    }

    getOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution des Œufs par Mois',
                    font: { size: 16, weight: 'bold' },
                    color: '#f59e0b'
                },
                legend: {
                    display: true, // Activer la légende pour identifier les secteurs
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#333',
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length === 0 || data.datasets.length === 0) {
                                return [];
                            }
                            return data.datasets.map((dataset, i) => ({
                                text: dataset.label,
                                fillStyle: dataset.borderColor,
                                strokeStyle: dataset.borderColor,
                                lineWidth: dataset.borderWidth,
                                pointStyle: dataset.pointStyle,
                                hidden: !chart.isDatasetVisible(i),
                                datasetIndex: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    cornerRadius: 8,
                    displayColors: true,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return `📅 ${context[0].label}`;
                        },
                        label: function(context) {
                            const secteur = context.dataset.label;
                            const secteurNames = {
                                'Sector 6': '🏢 Secteur 6',
                                'Sector 9': '🏢 Secteur 9',
                                'Sector 26': '🏢 Secteur 26',
                                'Sector 33': '🏢 Secteur 33'
                            };
                            const secteurName = secteurNames[secteur] || secteur;
                            return `${secteurName}: ${context.parsed.y.toLocaleString()} œufs`;
                        },
                        afterBody: function(context) {
                            const total = context.reduce((sum, item) => sum + item.parsed.y, 0);
                            return `📊 Total: ${total.toLocaleString()} œufs`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        font: { size: 12 },
                        maxRotation: 45
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
        // Pas d'événements spécifiques pour ce graphique
        console.log('📊 Événements configurés pour le graphique œufs par mois');
    }

    updateLegend() {
        const legendContainer = document.getElementById('oeufs-mois-legend');
        if (!legendContainer) {
            console.warn('⚠️ Container de légende non trouvé: oeufs-mois-legend');
            return;
        }

        console.log('📊 Données disponibles pour légende:', this.data);

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

            // Calculer le total pour ce secteur
            const secteurData = this.data?.chartData?.evolutionParSecteur?.[secteur] || [];
            const totalOeufs = secteurData.reduce((sum, item) => sum + item.total, 0);

            const legendItem = document.createElement('div');
            legendItem.className = 'flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg';
            legendItem.innerHTML = `
                <div class="w-4 h-4 rounded-full" style="background-color: ${color}"></div>
                <span class="font-medium text-gray-700">${secteurName}</span>
                <span class="text-gray-500">(${totalOeufs.toLocaleString()} œufs total)</span>
            `;

            legendContainer.appendChild(legendItem);
        });

        console.log('📊 Légende créée avec', secteurs.length, 'secteurs');
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

