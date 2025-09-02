// Variables globales
let analysesData = null;
let charts = {};

// Charger les données d'analyses au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Page analyses chargée, chargement des données...');
    await loadAnalysesData();
});

// Charger les données d'analyses depuis l'API
async function loadAnalysesData() {
    try {
        console.log('📊 Chargement des données d\'analyses...');
        const response = await fetch('/api/analyses');
        const result = await response.json();
        
        if (result.success) {
            analysesData = result.data;
            console.log('✅ Données d\'analyses chargées:', analysesData);
            
            // Créer les graphiques
            createCharts();
            
        } else {
            throw new Error(result.message || 'Erreur lors du chargement des données');
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des analyses:', error);
        showError('Erreur lors du chargement des données d\'analyses: ' + error.message);
    }
}

// Créer tous les graphiques
function createCharts() {
    console.log('🎨 Création des graphiques...');
    
    try {
        // Initialiser les sélecteurs de mois
        initializeMonthSelectors();
    
    // Créer les graphiques de la section Larves et Gîtes
    createLarvesChart();
        
        // Créer les graphiques de la section Œufs
    createOeufsSecteurChart();
        createOeufsMoisChart();
        
        // Créer les graphiques de la section Moustiques Adultes
    createDensiteAnnuelleChart();
    createDensiteSecteurChart();
    createGenreChart();
    
    console.log('✅ Tous les graphiques créés avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors de la création des graphiques:', error);
    }
}

// Initialiser les sélecteurs de mois
function initializeMonthSelectors() {
    console.log('📅 Initialisation des sélecteurs de mois...');
    
    // Sélecteur pour Œufs par Secteur
    const moisOeufsSecteurSelect = document.getElementById('mois-oeufs-secteur');
    if (moisOeufsSecteurSelect) {
        populateMonthSelector(moisOeufsSecteurSelect, 'oeufs');
        moisOeufsSecteurSelect.addEventListener('change', function() {
            updateOeufsSecteurChart(this.value);
        });
        console.log('✅ Sélecteur mois-oeufs-secteur initialisé');
    }
    
    // Sélecteur pour Répartition par Genre (Moustiques Adultes)
    const moisSelectionSelect = document.getElementById('mois-selection');
    if (moisSelectionSelect) {
        populateMonthSelector(moisSelectionSelect, 'adultes');
        moisSelectionSelect.addEventListener('change', function() {
            updateGenreChart(this.value);
        });
        console.log('✅ Sélecteur mois-selection initialisé');
    }
}

// Peupler un sélecteur de mois
function populateMonthSelector(selectElement, type) {
    if (!analysesData || !analysesData.chartData) {
        console.log('⚠️ Données non disponibles pour peupler le sélecteur');
        return;
    }
    
    // Vider le sélecteur
    selectElement.innerHTML = '<option value="">Tous les mois</option>';
    
    // Récupérer les périodes disponibles
    let periodes = [];
    if (type === 'oeufs' && analysesData.chartData.oeufs) {
        periodes = Object.keys(analysesData.chartData.oeufs);
    } else if (type === 'larves' && analysesData.chartData.larves) {
        periodes = Object.keys(analysesData.chartData.larves);
    } else if (type === 'adultes' && analysesData.chartData.adultes) {
        periodes = Object.keys(analysesData.chartData.adultes);
    }
    
    // Trier les périodes chronologiquement
    const periodesTriees = sortPeriodesChronologiquement(periodes);
    
    // Ajouter les options
    periodesTriees.forEach(periode => {
        const option = document.createElement('option');
        option.value = periode;
        option.textContent = periode;
        selectElement.appendChild(option);
    });
    
    console.log(`✅ Sélecteur ${type} peuplé avec ${periodesTriees.length} périodes`);
}

// Mettre à jour le graphique Œufs par Secteur selon le mois sélectionné
function updateOeufsSecteurChart(selectedMonth = '') {
    console.log(`🔄 Mise à jour du graphique Œufs par Secteur pour le mois: ${selectedMonth}`);
    
    if (!charts.oeufsSecteur) {
        console.log('⚠️ Graphique Œufs par Secteur non trouvé');
        return;
    }
    
    const chartData = prepareOeufsSecteurChartData(selectedMonth);
    charts.oeufsSecteur.data = chartData;
    charts.oeufsSecteur.update();
    
    console.log('✅ Graphique Œufs par Secteur mis à jour');
}

// Préparer les données pour le graphique Œufs par Secteur avec filtre par mois
function prepareOeufsSecteurChartData(selectedMonth = '') {
    if (!analysesData || !analysesData.chartData || !analysesData.chartData.oeufs) {
        return { labels: [], datasets: [] };
    }
    
    const secteurs = analysesData.secteurs || [];
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    
    if (selectedMonth) {
        // Afficher les données pour le mois sélectionné
        const data = secteurs.map(secteur => {
            return analysesData.chartData.oeufs[selectedMonth]?.[secteur] || 0;
        });
        
        return {
            labels: secteurs,
            datasets: [{
                label: `Œufs - ${selectedMonth}`,
                data: data,
                backgroundColor: colors.slice(0, secteurs.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    } else {
        // Afficher la moyenne de tous les mois
        const data = secteurs.map(secteur => {
            const periodes = Object.keys(analysesData.chartData.oeufs);
            const total = periodes.reduce((sum, periode) => {
                return sum + (analysesData.chartData.oeufs[periode]?.[secteur] || 0);
            }, 0);
            return Math.round(total / periodes.length);
        });
        
        return {
            labels: secteurs,
            datasets: [{
                label: 'Œufs - Moyenne tous mois',
                data: data,
                backgroundColor: colors.slice(0, secteurs.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    }
}

// Graphique des larves par période
function createLarvesChart() {
    const ctx = document.getElementById('larvesChart');
    if (!ctx) {
        console.log('⚠️ Canvas larvesChart non trouvé');
        return;
    }
    
    const chartData = prepareChartData('larves', 'Total Larves par Mois');
    console.log('📊 Données préparées pour larves:', chartData);
    
    charts.larves = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Total Larves par Mois',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                    labels: { 
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' larves';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: true,
                        color: '#f3f4f6'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre de Larves',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: true,
                        color: '#f3f4f6'
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 100) {
                                return (value / 1000).toFixed(1) + 'k';
                            }
                            return value;
                        }
                    }
                }
            },
            elements: {
                bar: {
                    borderRadius: 4,
                    borderSkipped: false
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Graphique Œufs par Secteur
function createOeufsSecteurChart() {
    const ctx = document.getElementById('oeufsSecteurChart');
    if (!ctx) {
        console.log('⚠️ Canvas oeufsSecteurChart non trouvé');
        return;
    }
    
    const chartData = prepareOeufsSecteurChartData();
    console.log('📊 Données préparées pour œufs secteur:', chartData);
    
    charts.oeufsSecteur = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Œufs par Secteur',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                    labels: { 
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre d\'Œufs',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 100) {
                                return (value / 1000).toFixed(1) + 'k';
                            }
                            return value;
                        }
                    }
                }
            },
            elements: {
                bar: {
                    borderRadius: 4
                }
            }
        }
    });
}

// Graphique Œufs par Mois
function createOeufsMoisChart() {
    const ctx = document.getElementById('oeufsMoisChart');
    if (!ctx) {
        console.log('⚠️ Canvas oeufsMoisChart non trouvé');
        return;
    }
    
    const chartData = prepareChartData('oeufs', 'Œufs par Mois');
    console.log('📊 Données préparées pour œufs mois:', chartData);
    
    charts.oeufsMois = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Œufs par Mois',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                    labels: { 
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre d\'Œufs',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 100) {
                                return (value / 1000).toFixed(1) + 'k';
                            }
                            return value;
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
}

// Graphique Densité Annuelle (Évolution par mois, sans secteurs)
function createDensiteAnnuelleChart() {
    const ctx = document.getElementById('densiteAnnuelleChart');
    if (!ctx) {
        console.log('⚠️ Canvas densiteAnnuelleChart non trouvé');
        return;
    }
    
    const chartData = prepareDensiteAnnuelleData();
    console.log('📊 Données préparées pour densité annuelle:', chartData);
    
    charts.densiteAnnuelle = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution des Moustiques Adultes par Mois',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    display: false // Pas de légende car un seul dataset
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Total: ' + context.parsed.y + ' moustiques';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: true,
                        color: '#f3f4f6'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre Total de Moustiques',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: true,
                        color: '#f3f4f6'
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 100) {
                                return (value / 1000).toFixed(1) + 'k';
                            }
                            return value;
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.4,
                    borderWidth: 3
                },
                point: {
                    radius: 5,
                    hoverRadius: 7,
                    backgroundColor: '#3b82f6'
                }
            }
        }
    });
}

// Graphique Densité par Secteur
function createDensiteSecteurChart() {
    const ctx = document.getElementById('densiteSecteurChart');
    if (!ctx) {
        console.log('⚠️ Canvas densiteSecteurChart non trouvé');
        return;
    }
    
    const chartData = prepareChartData('adultes', 'Densité par Secteur');
    console.log('📊 Données préparées pour densité secteur:', chartData);
    
    charts.densiteSecteur = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Densité des Moustiques Adultes par Secteur',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                    labels: { 
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre de Moustiques',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            if (value >= 100000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 100) {
                                return (value / 1000).toFixed(1) + 'k';
                            }
                            return value;
                        }
                    }
                }
            },
            elements: {
                bar: {
                    borderRadius: 4
                }
            }
        }
    });
}

// Graphique Répartition par Genre
function createGenreChart() {
    const ctx = document.getElementById('genreChart');
    if (!ctx) {
        console.log('⚠️ Canvas genreChart non trouvé');
        return;
    }
    
    const chartData = preparePieChartData();
    console.log('📊 Données préparées pour genre:', chartData);
    
    charts.genre = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Répartition par Genre',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'right',
                    labels: { 
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            elements: {
                arc: {
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }
            }
        }
    });
}

// Préparer les données pour un graphique en barres/ligne
function prepareChartData(dataType, title) {
    if (!analysesData || !analysesData.chartData || !analysesData.chartData[dataType]) {
        console.log(`⚠️ Données ${dataType} non disponibles`);
        return { labels: [], datasets: [] };
    }
    
    const periodes = Object.keys(analysesData.chartData[dataType]);
    const periodesTriees = sortPeriodesChronologiquement(periodes);
    const secteurs = analysesData.secteurs || [];
    
    console.log(`📊 ${title} - Périodes triées:`, periodesTriees);
    console.log(`📊 ${title} - Secteurs disponibles:`, secteurs);
    
    // Créer un dataset pour chaque secteur avec de meilleures couleurs
    const datasets = secteurs.map((secteur, index) => {
        const colors = [
            '#3b82f6', // Bleu
            '#10b981', // Vert
            '#f59e0b', // Orange
            '#ef4444', // Rouge
            '#8b5cf6', // Violet
            '#ec4899'  // Rose
        ];
        
        const data = periodesTriees.map(periode => {
            const valeur = analysesData.chartData[dataType][periode]?.[secteur] || 0;
            console.log(`📊 ${periode} - ${secteur}: ${valeur}`);
            return valeur;
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

// Préparer les données pour le graphique de densité annuelle (total par mois, sans secteurs)
function prepareDensiteAnnuelleData() {
    if (!analysesData || !analysesData.chartData || !analysesData.chartData.adultes) {
        console.log('⚠️ Données adultes non disponibles pour densité annuelle');
        return { labels: [], datasets: [] };
    }
    
    const periodes = Object.keys(analysesData.chartData.adultes);
    const periodesTriees = sortPeriodesChronologiquement(periodes);
    
    // Calculer le total par mois (tous secteurs confondus)
    const data = periodesTriees.map(periode => {
        const secteurs = analysesData.secteurs || [];
        const total = secteurs.reduce((sum, secteur) => {
            return sum + (analysesData.chartData.adultes[periode]?.[secteur] || 0);
        }, 0);
        console.log(`📊 ${periode} - Total tous secteurs: ${total}`);
        return total;
    });
    
    return {
        labels: periodesTriees,
        datasets: [{
            label: 'Total Moustiques',
            data: data,
            backgroundColor: '#3b82f6',
            borderColor: '#1e40af',
            borderWidth: 3,
            fill: false,
            tension: 0.4
        }]
    };
}

// Préparer les données pour le graphique en camembert (Répartition par Genre)
function preparePieChartData(selectedMonth = '') {
    if (!analysesData || !analysesData.chartData) {
        return { labels: [], datasets: [] };
    }
    
    // Utiliser directement les données par genre (mapping secteur -> genre)
    const genreMapping = {
        'Sector 6': 'Aedes',
        'Sector 9': 'Culex', 
        'Sector 26': 'Anopheles',
        'Sector 33': 'Autre'
    };
    
    const secteurs = analysesData.secteurs || [];
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    
    if (selectedMonth) {
        const data = secteurs.map(secteur => {
            return analysesData.chartData.adultes[selectedMonth]?.[secteur] || 0;
        });
        
        return {
            labels: secteurs.map(secteur => genreMapping[secteur] || secteur),
            datasets: [{
                label: `Moustiques Adultes par Genre - ${selectedMonth}`,
                data: data,
                backgroundColor: colors.slice(0, secteurs.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    } else {
        const data = secteurs.map(secteur => {
            const periodes = Object.keys(analysesData.chartData.adultes);
            const total = periodes.reduce((sum, periode) => {
                return sum + (analysesData.chartData.adultes[periode]?.[secteur] || 0);
            }, 0);
            return Math.round(total / periodes.length);
        });
    
        return {
            labels: secteurs.map(secteur => genreMapping[secteur] || secteur),
            datasets: [{
                label: 'Moustiques Adultes par Genre - Moyenne tous mois',
                data: data,
                backgroundColor: colors.slice(0, secteurs.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    }
    
    const genres = analysesData.genres || ['aedes', 'culex', 'anopheles', 'autre'];
    
    if (selectedMonth) {
        // Afficher les données pour le mois sélectionné
        const data = genres.map(genre => {
            return analysesData.chartData.adultesParGenre[selectedMonth]?.[genre] || 0;
        });
        
        return {
            labels: genres.map(genre => genre.charAt(0).toUpperCase() + genre.slice(1)),
            datasets: [{
                label: `Moustiques Adultes par Genre - ${selectedMonth}`,
                data: data,
                backgroundColor: colors.slice(0, genres.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    } else {
        // Afficher la moyenne de tous les mois
        const data = genres.map(genre => {
            const periodes = Object.keys(analysesData.chartData.adultesParGenre);
            const total = periodes.reduce((sum, periode) => {
                return sum + (analysesData.chartData.adultesParGenre[periode]?.[genre] || 0);
            }, 0);
            return Math.round(total / periodes.length);
        });
    
        return {
            labels: genres.map(genre => genre.charAt(0).toUpperCase() + genre.slice(1)),
            datasets: [{
                label: 'Moustiques Adultes par Genre - Moyenne tous mois',
                data: data,
                backgroundColor: colors.slice(0, genres.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
    }
}

// Mettre à jour le graphique de genre selon le mois sélectionné
function updateGenreChart(selectedMonth = '') {
    console.log(`🔄 Mise à jour du graphique Répartition par Genre pour le mois: ${selectedMonth}`);
    
    if (!charts.genre) {
        console.log('⚠️ Graphique Répartition par Genre non trouvé');
        return;
    }
    
    const chartData = preparePieChartData(selectedMonth);
    charts.genre.data = chartData;
    charts.genre.update();
    
    console.log('✅ Graphique Répartition par Genre mis à jour');
}

// Fonction pour trier les périodes chronologiquement
function sortPeriodesChronologiquement(periodes) {
    const moisOrder = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    return periodes.sort((a, b) => {
        const matchA = a.match(/(.+?)\s+(\d{4})/);
        const matchB = b.match(/(.+?)\s+(\d{4})/);
        
        if (!matchA || !matchB) {
            return 0;
        }
        
        const periodeA = matchA[1].trim();
        const anneeA = parseInt(matchA[2]);
        const periodeB = matchB[1].trim();
        const anneeB = parseInt(matchB[2]);
        
        if (anneeA !== anneeB) {
            return anneeA - anneeB;
        }
        
        const indexA = moisOrder.indexOf(periodeA);
        const indexB = moisOrder.indexOf(periodeB);
        
        if (indexA === -1 || indexB === -1) {
            return 0;
        }
        
        return indexA - indexB;
    });
}

// Fonction pour afficher les erreurs
function showError(message) {
    console.error('❌ Erreur:', message);
    // Vous pouvez ajouter ici une logique pour afficher l'erreur à l'utilisateur
}
