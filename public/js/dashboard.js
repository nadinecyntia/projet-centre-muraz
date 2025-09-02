// Script pour le Dashboard Centre MURAZ
class DashboardManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        console.log('📊 Initialisation du Dashboard...');
        
        // Charger les statistiques
        await this.loadStatistics();
        
        // Initialiser les graphiques
        this.initCharts();
        
        // Mettre à jour les données périodiquement
        this.startAutoRefresh();
    }

    async loadStatistics() {
        try {
            console.log('📈 Chargement des statistiques...');
            
            // Simuler des données pour l'instant
            // En production, ces données viendraient de l'API
            const stats = {
                entomological: 156,
                labAnalysis: 42,
                indices: 8,
                alerts: 2
            };

            // Mettre à jour les compteurs
            this.updateCounters(stats);
            
            console.log('✅ Statistiques chargées:', stats);
            
        } catch (error) {
            console.error('❌ Erreur chargement statistiques:', error);
        }
    }

    updateCounters(stats) {
        // Animation des compteurs
        this.animateCounter('entomological-count', stats.entomological);
        this.animateCounter('lab-analysis-count', stats.labAnalysis);
        this.animateCounter('indices-count', stats.indices);
        this.animateCounter('alerts-count', stats.alerts);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const duration = 1000;
        const increment = targetValue / (duration / 16); // 60 FPS
        let currentValue = startValue;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentValue);
        }, 16);
    }

    initCharts() {
        console.log('📊 Initialisation des graphiques...');
        
        // Graphique Évolution Temporelle
        this.initTemporalChart();
        
        // Graphique Répartition par Secteur
        this.initSectorChart();
    }

    initTemporalChart() {
        const ctx = document.getElementById('temporalChart');
        if (!ctx) return;

        this.charts.temporal = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
                datasets: [{
                    label: 'Données Entomologiques',
                    data: [12, 19, 15, 25, 22, 30, 28, 35, 42, 38, 45, 50],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Analyses Laboratoire',
                    data: [5, 8, 6, 12, 10, 15, 18, 22, 25, 20, 28, 30],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Évolution des données sur 12 mois'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    initSectorChart() {
        const ctx = document.getElementById('sectorChart');
        if (!ctx) return;

        this.charts.sector = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Secteur 6', 'Secteur 9', 'Secteur 26', 'Secteur 33'],
                datasets: [{
                    data: [25, 30, 20, 25],
                    backgroundColor: [
                        '#3B82F6',
                        '#10B981',
                        '#F59E0B',
                        '#EF4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Répartition des données par secteur'
                    }
                }
            }
        });
    }

    startAutoRefresh() {
        // Rafraîchir les données toutes les 5 minutes
        setInterval(async () => {
            console.log('🔄 Rafraîchissement automatique des données...');
            await this.loadStatistics();
        }, 5 * 60 * 1000);
    }

    // Méthode pour rafraîchir manuellement
    async refreshData() {
        console.log('🔄 Rafraîchissement manuel...');
        await this.loadStatistics();
        
        // Mettre à jour les graphiques si nécessaire
        if (this.charts.temporal) {
            this.charts.temporal.update();
        }
        if (this.charts.sector) {
            this.charts.sector.update();
        }
    }
}

// Initialiser le dashboard quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM chargé, initialisation du Dashboard...');
    window.dashboardManager = new DashboardManager();
});

// Fonction globale pour rafraîchir les données
window.refreshDashboard = function() {
    if (window.dashboardManager) {
        window.dashboardManager.refreshData();
    }
};






