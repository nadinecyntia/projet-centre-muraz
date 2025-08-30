// Interface Indices Entomologiques - Centre MURAZ
// Chargement dynamique des indices calculés depuis l'API

// Variables globales
let indicesData = null;
let indicesCharts = {};

// Variables pour la pagination et les filtres
let currentPage = 1;
let rowsPerPage = 10;
let filteredData = [];
let allTableData = [];

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧮 Interface Indices Entomologiques - Initialisation...');
    loadIndicesData();
});

// Charger les indices entomologiques depuis l'API
async function loadIndicesData() {
    try {
        console.log('🧮 Chargement des indices entomologiques...');
        
        const response = await fetch('/api/indices');
        const result = await response.json();
        
        if (result.success) {
            indicesData = result.data;
            console.log('✅ Indices entomologiques chargés:', indicesData);
            
            // Mettre à jour l'interface
            updateIndicesInterface();
            
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des indices:', error);
        showError('Erreur lors du chargement des indices entomologiques: ' + error.message);
    }
}

// Mettre à jour l'interface avec les indices
function updateIndicesInterface() {
    if (!indicesData) return;
    
    console.log('🔄 Mise à jour de l\'interface des indices...');
    
    // Initialiser le sélecteur de mois
    initializeMonthSelector();
    
    // Mettre à jour les résultats des indices (moyennes globales)
    updateIndicesResults();
    
    // Mettre à jour le tableau des indices bimensuels
    updateIndicesBimensuelsTable();
    
    // Créer les graphiques des indices
    createIndicesCharts();
}

// Initialiser le sélecteur de mois
function initializeMonthSelector() {
    console.log('📅 Initialisation du sélecteur de mois pour les indices...');
    
    const moisSelect = document.getElementById('mois-selection-indices');
    if (!moisSelect) {
        console.log('⚠️ Sélecteur de mois non trouvé');
        return;
    }
    
    // Vider le sélecteur
    moisSelect.innerHTML = '<option value="">Choisir un mois...</option>';
    
    // Convertir les périodes bimensuelles en mois individuels
    const periodes = indicesData.periodes;
    const mois = convertPeriodesToMois(periodes);
    
    console.log('📅 Mois disponibles pour les indices:', mois);
    
    // Ajouter chaque mois comme option
    mois.forEach(mois => {
        const option = document.createElement('option');
        option.value = mois;
        option.textContent = mois;
        moisSelect.appendChild(option);
    });
    
    // Ajouter l'écouteur d'événement
    moisSelect.addEventListener('change', updateIndicesByMonth);
    
    console.log(`✅ Sélecteur de mois initialisé avec ${mois.length} mois`);
}

// Convertir les périodes mensuelles en mois individuels (maintenant c'est direct)
function convertPeriodesToMois(periodes) {
    // Maintenant les périodes sont déjà des mois individuels
    // On peut les retourner directement
    return periodes;
}

// Mettre à jour les indices selon le mois sélectionné
function updateIndicesByMonth() {
    const moisSelect = document.getElementById('mois-selection-indices');
    const selectedMonth = moisSelect ? moisSelect.value : '';
    
    console.log('📅 Mise à jour des indices pour le mois:', selectedMonth);
    
    if (selectedMonth) {
        // Trouver la période qui contient ce mois
        const periode = findPeriodeByMonth(selectedMonth);
        if (periode) {
            updateIndicesForPeriode(periode);
            updateTableauTitle(selectedMonth);
            // Mettre à jour le graphique de secteur
            updateSectorChart(selectedMonth);
        }
    } else {
        // Afficher tous les indices
        updateIndicesForAllPeriodes();
        updateTableauTitle();
        // Mettre à jour le graphique de secteur avec le premier mois
        if (indicesData && indicesData.periodes && indicesData.periodes.length > 0) {
            updateSectorChart(indicesData.periodes[0]);
        }
    }
}

// Trouver la période mensuelle qui correspond au mois donné
function findPeriodeByMonth(month) {
    // Maintenant c'est direct : le mois sélectionné = la période
    return month;
}

// Mettre à jour les indices pour une période spécifique
function updateIndicesForPeriode(periode) {
    console.log('📊 Mise à jour des indices pour la période:', periode);
    
    // Mettre à jour les cartes d'indices
    updateIndicesCardsForPeriode(periode);
    
    // Mettre à jour le tableau
    updateIndicesTableForPeriode(periode);
    
    // Mettre à jour les graphiques
    updateChartsForPeriode(periode);
}

// Mettre à jour les indices pour toutes les périodes
function updateIndicesForAllPeriodes() {
    console.log('📊 Mise à jour des indices pour toutes les périodes');
    
    // Mettre à jour les cartes d'indices (moyennes globales)
    updateIndicesResults();
    
    // Mettre à jour le tableau complet
    updateIndicesBimensuelsTable();
    
    // Mettre à jour les graphiques complets
    createIndicesCharts();
}

// Mettre à jour le titre du tableau
function updateTableauTitle(selectedMonth = '') {
    const titre = document.getElementById('tableau-titre');
    const description = document.getElementById('tableau-description');
    
    if (selectedMonth) {
        titre.textContent = `Données des Indices - ${selectedMonth}`;
        description.textContent = `Vue détaillée des indices entomologiques pour ${selectedMonth} par secteur`;
    } else {
        titre.textContent = 'Données des Indices Mensuels';
        description.textContent = 'Vue détaillée de tous les indices entomologiques par secteur et mois';
    }
}

// Mettre à jour les cartes d'indices pour une période spécifique
function updateIndicesCardsForPeriode(periode) {
    console.log('📊 Mise à jour des cartes d\'indices pour la période:', periode);
    
    // Calculer les moyennes pour cette période
    const moyennes = calculateAveragesForPeriode(periode);
    
    // Mettre à jour l'Indice de Breteau
    const breteauResultat = document.getElementById('breteau-resultat');
    if (breteauResultat) {
        breteauResultat.textContent = moyennes.breteau.toFixed(2) + '%';
        breteauResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.breteau, 'breteau')}`;
    }
    
    // Mettre à jour l'Indice de Maison
    const maisonResultat = document.getElementById('maison-resultat');
    if (maisonResultat) {
        maisonResultat.textContent = moyennes.maison.toFixed(2) + '%';
        maisonResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.maison, 'maison')}`;
    }
    
    // Mettre à jour l'Indice de Récipient
    const recipientResultat = document.getElementById('recipient-resultat');
    if (recipientResultat) {
        recipientResultat.textContent = moyennes.recipient.toFixed(2) + '%';
        recipientResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.recipient, 'recipient')}`;
    }
    
    // Mettre à jour l'Indice de Pondoire
    const pondoirResultat = document.getElementById('pondoir-resultat');
    if (pondoirResultat) {
        pondoirResultat.textContent = moyennes.pondoir.toFixed(2) + '%';
        pondoirResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.pondoir, 'pondoir')}`;
    }
    
    // Mettre à jour l'Indice de Colonisation Nymphale
    const nymphaleResultat = document.getElementById('nymphale-resultat');
    if (nymphaleResultat) {
        nymphaleResultat.textContent = moyennes.nymphal_colonization.toFixed(2) + '%';
        nymphaleResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.nymphal_colonization, 'maison')}`;
    }
    
    // Mettre à jour l'Indice Adultes par Piège BG
    const adultesResultat = document.getElementById('adultes-resultat');
    if (adultesResultat) {
        adultesResultat.textContent = moyennes.adult_per_trap_bg.toFixed(1);
        adultesResultat.className = `text-2xl font-bold text-red-800`;
    }
    
    // Mettre à jour l'Indice Adultes par Piège Prokopack
    const prokopackResultat = document.getElementById('prokopack-resultat');
    if (prokopackResultat) {
        prokopackResultat.textContent = moyennes.adult_per_trap_prokopack.toFixed(1);
        prokopackResultat.className = `text-2xl font-bold text-pink-800`;
    }
}

// Calculer les moyennes pour une période spécifique
function calculateAveragesForPeriode(periode) {
    const secteurs = indicesData.secteurs;
    
    const moyennes = {
        breteau: 0,
        maison: 0,
        recipient: 0,
        pondoir: 0,
        nymphal_colonization: 0,
        adult_per_trap_bg: 0,
        adult_per_trap_prokopack: 0
    };
    
    // Calculer les moyennes pour cette période
    secteurs.forEach(secteur => {
        moyennes.breteau += indicesData.breteau[periode]?.[secteur] || 0;
        moyennes.maison += indicesData.maison[periode]?.[secteur] || 0;
        moyennes.recipient += indicesData.recipient[periode]?.[secteur] || 0;
        moyennes.pondoir += indicesData.pondoir[periode]?.[secteur] || 0;
        moyennes.nymphal_colonization += indicesData.nymphal_colonization[periode]?.[secteur] || 0;
        moyennes.adult_per_trap_bg += indicesData.adult_per_trap_bg[periode]?.[secteur] || 0;
        moyennes.adult_per_trap_prokopack += indicesData.adult_per_trap_prokopack[periode]?.[secteur] || 0;
    });
    
    // Diviser par le nombre de secteurs
    const nbSecteurs = secteurs.length;
    Object.keys(moyennes).forEach(key => {
        moyennes[key] = moyennes[key] / nbSecteurs;
    });
    
    return moyennes;
}

// Mettre à jour le tableau pour une période spécifique
function updateIndicesTableForPeriode(periode) {
    console.log('📊 Mise à jour du tableau pour la période:', periode);
    
    const tbody = document.getElementById('indices-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Afficher seulement les données pour cette période
        indicesData.secteurs.forEach(secteur => {
            const row = document.createElement('tr');
            
            // Récupérer les valeurs des indices pour cette période et ce secteur
            const ib = indicesData.breteau[periode]?.[secteur] || 0;
            const im = indicesData.maison[periode]?.[secteur] || 0;
            const ir = indicesData.recipient[periode]?.[secteur] || 0;
            const ipp = indicesData.pondoir[periode]?.[secteur] || 0;
            
            // Récupérer les valeurs des nouveaux indices
            const icn = indicesData.nymphal_colonization?.[periode]?.[secteur] || 0;
            const iap_bg = indicesData.adult_per_trap_bg?.[periode]?.[secteur] || 0;
            const iap_prokopack = indicesData.adult_per_trap_prokopack?.[periode]?.[secteur] || 0;
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${periode}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${secteur}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(ib, 'breteau')}">${ib.toFixed(2)}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(im, 'maison')}">${im.toFixed(2)}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(ir, 'recipient')}">${ir.toFixed(2)}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(ipp, 'pondoir')}">${ipp.toFixed(2)}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(icn, 'maison')}">${icn.toFixed(2)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-800">${iap_bg.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-pink-800">${iap_prokopack.toFixed(2)}</td>
            `;
            
            tbody.appendChild(row);
        });
}

// Mettre à jour les graphiques pour une période spécifique
function updateChartsForPeriode(periode) {
    console.log('📊 Mise à jour des graphiques pour la période:', periode);
    
    // Pour l'instant, on garde les graphiques complets
    // On pourrait les adapter pour montrer seulement la période sélectionnée
    createIndicesCharts();
}

// Mettre à jour les résultats des indices dans les cartes
function updateIndicesResults() {
    if (!indicesData) return;
    
    console.log('📊 Mise à jour des résultats des indices...');
    
    // Calculer les moyennes globales pour chaque indice
    const moyennes = calculateGlobalAverages();
    
    // Mettre à jour l'Indice de Breteau
    const breteauResultat = document.getElementById('breteau-resultat');
    if (breteauResultat) {
        breteauResultat.textContent = moyennes.breteau.toFixed(2) + '%';
        breteauResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.breteau, 'breteau')}`;
    }
    
    // Mettre à jour l'Indice de Maison
    const maisonResultat = document.getElementById('maison-resultat');
    if (maisonResultat) {
        maisonResultat.textContent = moyennes.maison.toFixed(2) + '%';
        maisonResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.maison, 'maison')}`;
    }
    
    // Mettre à jour l'Indice de Récipient
    const recipientResultat = document.getElementById('recipient-resultat');
    if (recipientResultat) {
        recipientResultat.textContent = moyennes.recipient.toFixed(2) + '%';
        recipientResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.recipient, 'recipient')}`;
    }
    
    // Mettre à jour l'Indice de Pondoire
    const pondoirResultat = document.getElementById('pondoir-resultat');
    if (pondoirResultat) {
        pondoirResultat.textContent = moyennes.pondoir.toFixed(2) + '%';
        pondoirResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.pondoir, 'pondoir')}`;
    }
    
    // Mettre à jour l'Indice de Colonisation Nymphale
    const nymphaleResultat = document.getElementById('nymphale-resultat');
    if (nymphaleResultat) {
        nymphaleResultat.textContent = moyennes.nymphal_colonization.toFixed(2) + '%';
        nymphaleResultat.className = `text-2xl font-bold ${getIndiceClass(moyennes.nymphal_colonization, 'maison')}`;
    }
    
    // Mettre à jour l'Indice Adultes par Piège BG
    const adultesResultat = document.getElementById('adultes-resultat');
    if (adultesResultat) {
        adultesResultat.textContent = moyennes.adult_per_trap_bg.toFixed(1);
        adultesResultat.className = `text-2xl font-bold text-red-800`;
    }
    
    // Mettre à jour l'Indice Adultes par Piège Prokopack
    const prokopackResultat = document.getElementById('prokopack-resultat');
    if (prokopackResultat) {
        prokopackResultat.textContent = moyennes.adult_per_trap_prokopack.toFixed(1);
        prokopackResultat.className = `text-2xl font-bold text-pink-800`;
    }
}

// Calculer les moyennes globales pour tous les indices
function calculateGlobalAverages() {
    if (!indicesData || !indicesData.periodes || !indicesData.secteurs) {
        return {
            breteau: 0, maison: 0, recipient: 0, pondoir: 0,
            nymphal_colonization: 0, adult_per_trap_bg: 0, adult_per_trap_prokopack: 0
        };
    }
    
    const moyennes = {
        breteau: 0, maison: 0, recipient: 0, pondoir: 0,
        nymphal_colonization: 0, adult_per_trap_bg: 0, adult_per_trap_prokopack: 0
    };
    
    let totalPeriodes = 0;
    
    indicesData.periodes.forEach(periode => {
        indicesData.secteurs.forEach(secteur => {
            moyennes.breteau += indicesData.breteau[periode]?.[secteur] || 0;
            moyennes.maison += indicesData.maison[periode]?.[secteur] || 0;
            moyennes.recipient += indicesData.recipient[periode]?.[secteur] || 0;
            moyennes.pondoir += indicesData.pondoir[periode]?.[secteur] || 0;
            moyennes.nymphal_colonization += indicesData.nymphal_colonization[periode]?.[secteur] || 0;
            moyennes.adult_per_trap_bg += indicesData.adult_per_trap_bg[periode]?.[secteur] || 0;
            moyennes.adult_per_trap_prokopack += indicesData.adult_per_trap_prokopack[periode]?.[secteur] || 0;
        });
        totalPeriodes++;
    });
    
    const totalSecteurs = indicesData.secteurs.length;
    const totalCalculs = totalPeriodes * totalSecteurs;
    
    if (totalCalculs > 0) {
        Object.keys(moyennes).forEach(key => {
            moyennes[key] = moyennes[key] / totalCalculs;
        });
    }
    
    return moyennes;
}

// Mettre à jour le tableau des indices avec pagination et filtres
function updateIndicesBimensuelsTable() {
    if (!indicesData || !indicesData.periodes || !indicesData.secteurs) return;
    
    console.log('📊 Mise à jour du tableau des indices avec pagination...');
    
    // Préparer toutes les données du tableau
    prepareAllTableData();
    
    // Appliquer les filtres et la pagination
    applyFiltersAndPagination();
    
    // Initialiser les filtres
    initializeFilters();
    
    // Initialiser la pagination
    initializePagination();
}

// Créer les graphiques des indices
function createIndicesCharts() {
    console.log('📊 Création des graphiques des indices...');
    
    // Configuration globale de Chart.js
    Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
    Chart.defaults.color = '#374151';
    
    // Couleurs personnalisées Centre MURAZ
    const colors = {
        murazBlue: '#1e40af',
        murazGreen: '#059669',
        murazOrange: '#ea580c',
        murazRed: '#dc2626',
        blue: '#3b82f6',
        green: '#10b981',
        orange: '#f97316',
        red: '#ef4444',
        purple: '#8b5cf6',
        indigo: '#6366f1',
        pink: '#ec4899'
    };
    
    // Graphique de comparaison par secteur
    createComparisonChart(colors);
    
    // Graphique de tendance
    createTrendChart(colors);

    // Graphique de comparaison par secteur pour un mois spécifique
    createSectorChart(colors);
}

// Cette fonction a été supprimée car elle créait un graphique redondant
// avec createTrendChart qui affiche maintenant l'évolution mensuelle complète

// Créer le graphique de comparaison par secteur
function createComparisonChart(colors) {
    const ctx = document.getElementById('indicesComparisonChart');
    if (!ctx) return;
    
    // Créer un graphique en barres groupées par mois
    const datasets = [];
    
    if (indicesData.breteau) {
        datasets.push({
            label: 'Indice Breteau (IB)',
            data: indicesData.periodes.map(periode => {
                const valeurs = indicesData.secteurs.map(secteur => 
                    indicesData.breteau[periode]?.[secteur] || 0
                );
                return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            }),
            backgroundColor: colors.murazBlue,
            borderColor: colors.murazBlue,
            borderWidth: 1
        });
    }
    
    if (indicesData.maison) {
        datasets.push({
            label: 'Indice Maison (IM)',
            data: indicesData.periodes.map(periode => {
                const valeurs = indicesData.secteurs.map(secteur => 
                    indicesData.maison[periode]?.[secteur] || 0
                );
                return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            }),
            backgroundColor: colors.murazGreen,
            borderColor: colors.murazGreen,
            borderWidth: 1
        });
    }
    
    if (indicesData.recipient) {
        datasets.push({
            label: 'Indice Récipient (IR)',
            data: indicesData.periodes.map(periode => {
                const valeurs = indicesData.secteurs.map(secteur => 
                    indicesData.recipient[periode]?.[secteur] || 0
                );
                return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            }),
            backgroundColor: colors.murazOrange,
            borderColor: colors.murazOrange,
            borderWidth: 1
        });
    }
    
    if (indicesData.pondoir) {
        datasets.push({
            label: 'Indice Pondoire (IPP)',
            data: indicesData.periodes.map(periode => {
                const valeurs = indicesData.secteurs.map(secteur => 
                    indicesData.pondoir[periode]?.[secteur] || 0
                );
                return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            }),
            backgroundColor: colors.purple,
            borderColor: colors.purple,
            borderWidth: 1
        });
    }
    
    indicesCharts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: indicesData.periodes,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparaison des Indices par Mois (Moyenne des Secteurs)',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valeur de l\'Indice (%)'
                    }
                },
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

// Créer le graphique de tendance
function createTrendChart(colors) {
    const ctx = document.getElementById('indicesTrendChart');
    if (!ctx) return;
    
    // Créer un graphique d'évolution mensuelle complète
    const datasets = [];
    
    if (indicesData.breteau) {
        datasets.push({
            label: 'Indice Breteau (IB)',
            data: indicesData.periodes.map(periode => {
                const valeurs = indicesData.secteurs.map(secteur => 
                    indicesData.breteau[periode]?.[secteur] || 0
                );
                return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            }),
            borderColor: colors.murazBlue,
            backgroundColor: colors.murazBlue + '20',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: colors.murazBlue,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
        });
    }
    
    if (indicesData.maison) {
        datasets.push({
            label: 'Indice Maison (IM)',
            data: indicesData.periodes.map(periode => {
                const valeurs = indicesData.secteurs.map(secteur => 
                    indicesData.maison[periode]?.[secteur] || 0
                );
                return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            }),
            borderColor: colors.murazGreen,
            backgroundColor: colors.murazGreen + '20',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: colors.murazGreen,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
        });
    }
    
    if (indicesData.recipient) {
        datasets.push({
            label: 'Indice Récipient (IR)',
            data: indicesData.periodes.map(periode => {
                const valeurs = indicesData.secteurs.map(secteur => 
                    indicesData.recipient[periode]?.[secteur] || 0
                );
                return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            }),
            borderColor: colors.murazOrange,
            backgroundColor: colors.murazOrange + '20',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: colors.murazOrange,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
        });
    }
    
    if (indicesData.pondoir) {
        datasets.push({
            label: 'Indice Pondoire (IPP)',
            data: indicesData.periodes.map(periode => {
                const valeurs = indicesData.secteurs.map(secteur => 
                    indicesData.pondoir[periode]?.[secteur] || 0
                );
                return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
            }),
            borderColor: colors.purple,
            backgroundColor: colors.purple + '20',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: colors.purple,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4
        });
    }
    
    indicesCharts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: indicesData.periodes,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution Mensuelle des Indices (Moyenne des Secteurs)',
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valeur de l\'Indice (%)'
                    }
                },
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

// Créer le graphique de comparaison par secteur pour un mois spécifique
function createSectorChart(colors) {
    const ctx = document.getElementById('indicesSectorChart');
    if (!ctx) return;
    
    // Utiliser le mois sélectionné ou le premier mois disponible
    const selectedMonth = document.getElementById('mois-selection-indices')?.value || indicesData.periodes[0];
    
    const datasets = [];
    
    if (indicesData.breteau && indicesData.breteau[selectedMonth]) {
        datasets.push({
            label: 'Indice Breteau (IB)',
            data: indicesData.secteurs.map(secteur => 
                indicesData.breteau[selectedMonth]?.[secteur] || 0
            ),
            backgroundColor: colors.murazBlue,
            borderColor: colors.murazBlue,
            borderWidth: 1
        });
    }
    
    if (indicesData.maison && indicesData.maison[selectedMonth]) {
        datasets.push({
            label: 'Indice Maison (IM)',
            data: indicesData.secteurs.map(secteur => 
                indicesData.maison[selectedMonth]?.[secteur] || 0
            ),
            backgroundColor: colors.murazGreen,
            borderColor: colors.murazGreen,
            borderWidth: 1
        });
    }
    
    if (indicesData.recipient && indicesData.recipient[selectedMonth]) {
        datasets.push({
            label: 'Indice Récipient (IR)',
            data: indicesData.secteurs.map(secteur => 
                indicesData.recipient[selectedMonth]?.[secteur] || 0
            ),
            backgroundColor: colors.murazOrange,
            borderColor: colors.murazOrange,
            borderWidth: 1
        });
    }
    
    if (indicesData.pondoir && indicesData.pondoir[selectedMonth]) {
        datasets.push({
            label: 'Indice Pondoire (IPP)',
            data: indicesData.secteurs.map(secteur => 
                indicesData.pondoir[selectedMonth]?.[secteur] || 0
            ),
            backgroundColor: colors.purple,
            borderColor: colors.purple,
            borderWidth: 1
        });
    }
    
    indicesCharts.sector = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: indicesData.secteurs,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Comparaison des Indices par Secteur - ${selectedMonth}`,
                    font: { size: 16, weight: 'bold' }
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valeur de l\'Indice (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Secteur'
                    }
                }
            }
        }
    });
}

// Mettre à jour le graphique de secteur pour un mois spécifique
function updateSectorChart(selectedMonth) {
    if (!indicesCharts.sector) return;
    
    console.log('📊 Mise à jour du graphique de secteur pour:', selectedMonth);
    
    // Détruire l'ancien graphique
    indicesCharts.sector.destroy();
    
    // Recréer le graphique avec le nouveau mois
    const colors = {
        murazBlue: '#1e40af',
        murazGreen: '#059669',
        murazOrange: '#ea580c',
        purple: '#7c3aed'
    };
    
    createSectorChart(colors);
}

// Cette fonction n'est plus utilisée - remplacée par createTrendChart
// qui affiche maintenant l'évolution mensuelle complète

// Fonction utilitaire pour obtenir la classe CSS selon la valeur de l'indice
function getIndiceClass(valeur, type) {
    switch(type) {
        case 'breteau':
            if (valeur < 5) return 'text-green-600 font-semibold';
            if (valeur < 20) return 'text-yellow-600 font-semibold';
            return 'text-red-600 font-semibold';
        case 'maison':
            if (valeur < 3) return 'text-green-600 font-semibold';
            if (valeur < 10) return 'text-yellow-600 font-semibold';
            return 'text-red-600 font-semibold';
        case 'recipient':
            if (valeur < 3) return 'text-green-600 font-semibold';
            if (valeur < 10) return 'text-yellow-600 font-semibold';
            return 'text-red-600 font-semibold';
        case 'pondoir':
            if (valeur < 3) return 'text-green-600 font-semibold';
            if (valeur < 10) return 'text-red-600 font-semibold';
            return 'text-red-600 font-semibold';
        default:
            return 'text-gray-600';
    }
}

// Afficher une erreur
function showError(message) {
    console.error('❌ Erreur:', message);
    
    // Créer un élément d'erreur visible
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
    errorDiv.innerHTML = `
        <strong class="font-bold">Erreur !</strong>
        <span class="block sm:inline">${message}</span>
    `;
    
    // Insérer au début de la page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorDiv, container.firstChild);
}

// Fonction de rafraîchissement des données
function refreshIndicesData() {
    console.log('🔄 Rafraîchissement des indices...');
    
    // Détruire les graphiques existants
    Object.values(indicesCharts).forEach(chart => {
        if (chart && chart.destroy) {
            chart.destroy();
        }
    });
    indicesCharts = {};
    
    // Recharger les données
    loadIndicesData();
}

// Exposer la fonction de rafraîchissement globalement
window.refreshIndicesData = refreshIndicesData;

// ===== FONCTIONS DE PAGINATION ET FILTRAGE =====

// Préparer toutes les données du tableau
function prepareAllTableData() {
    allTableData = [];
    
    indicesData.periodes.forEach(periode => {
        indicesData.secteurs.forEach(secteur => {
            const ib = indicesData.breteau[periode]?.[secteur] || 0;
            const im = indicesData.maison[periode]?.[secteur] || 0;
            const ir = indicesData.recipient[periode]?.[secteur] || 0;
            const ipp = indicesData.pondoir[periode]?.[secteur] || 0;
            const icn = indicesData.nymphal_colonization?.[periode]?.[secteur] || 0;
            const iap_bg = indicesData.adult_per_trap_bg?.[periode]?.[secteur] || 0;
            const iap_prokopack = indicesData.adult_per_trap_prokopack?.[periode]?.[secteur] || 0;
            
            allTableData.push({
                periode,
                secteur,
                ib,
                im,
                ir,
                ipp,
                icn,
                iap_bg,
                iap_prokopack
            });
        });
    });
    
    console.log(`📊 ${allTableData.length} données préparées pour le tableau`);
}

// Initialiser les filtres
function initializeFilters() {
    // Remplir le filtre des mois
    const filtreMois = document.getElementById('filtre-mois');
    if (filtreMois) {
        filtreMois.innerHTML = '<option value="">Tous les mois</option>';
        indicesData.periodes.forEach(periode => {
            const option = document.createElement('option');
            option.value = periode;
            option.textContent = periode;
            filtreMois.appendChild(option);
        });
    }
    
    // Remplir le filtre des secteurs
    const filtreSecteur = document.getElementById('filtre-secteur');
    if (filtreSecteur) {
        filtreSecteur.innerHTML = '<option value="">Tous les secteurs</option>';
        indicesData.secteurs.forEach(secteur => {
            const option = document.createElement('option');
            option.value = secteur;
            option.textContent = secteur;
            filtreSecteur.appendChild(option);
        });
    }
    
    // Ajouter les événements
    addFilterEvents();
}

// Ajouter les événements des filtres
function addFilterEvents() {
    // Filtre par mois
    const filtreMois = document.getElementById('filtre-mois');
    if (filtreMois) {
        filtreMois.addEventListener('change', applyFiltersAndPagination);
    }
    
    // Filtre par secteur
    const filtreSecteur = document.getElementById('filtre-secteur');
    if (filtreSecteur) {
        filtreSecteur.addEventListener('change', applyFiltersAndPagination);
    }
    
    // Recherche
    const recherche = document.getElementById('recherche-indices');
    if (recherche) {
        recherche.addEventListener('input', applyFiltersAndPagination);
    }
    
    // Lignes par page
    const lignesParPage = document.getElementById('lignes-par-page');
    if (lignesParPage) {
        lignesParPage.addEventListener('change', (e) => {
            rowsPerPage = parseInt(e.target.value);
            currentPage = 1;
            applyFiltersAndPagination();
        });
    }
    
    // Bouton réinitialiser
    const reinitialiser = document.getElementById('reinitialiser-filtres');
    if (reinitialiser) {
        reinitialiser.addEventListener('click', resetFilters);
    }
    
    // Boutons de pagination
    const btnPrecedent = document.getElementById('btn-precedent');
    if (btnPrecedent) {
        btnPrecedent.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                applyFiltersAndPagination();
            }
        });
    }
    
    const btnSuivant = document.getElementById('btn-suivant');
    if (btnSuivant) {
        btnSuivant.addEventListener('click', () => {
            const maxPages = Math.ceil(filteredData.length / rowsPerPage);
            if (currentPage < maxPages) {
                currentPage++;
                applyFiltersAndPagination();
            }
        });
    }
}

// Appliquer les filtres et la pagination
function applyFiltersAndPagination() {
    // Appliquer les filtres
    applyFilters();
    
    // Appliquer la pagination
    applyPagination();
    
    // Mettre à jour les informations
    updatePaginationInfo();
}

// Appliquer les filtres
function applyFilters() {
    const filtreMois = document.getElementById('filtre-mois')?.value || '';
    const filtreSecteur = document.getElementById('filtre-secteur')?.value || '';
    const recherche = document.getElementById('recherche-indices')?.value || '';
    
    filteredData = allTableData.filter(item => {
        // Filtre par mois
        if (filtreMois && item.periode !== filtreMois) return false;
        
        // Filtre par secteur
        if (filtreSecteur && item.secteur !== filtreSecteur) return false;
        
        // Recherche textuelle
        if (recherche) {
            const searchTerm = recherche.toLowerCase();
            const searchableText = `${item.periode} ${item.secteur}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        return true;
    });
    
    console.log(`🔍 ${filteredData.length} résultats après filtrage`);
}

// Appliquer la pagination
function applyPagination() {
    const tbody = document.getElementById('indices-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.periode}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.secteur}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(item.ib, 'breteau')}">${item.ib.toFixed(2)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(item.im, 'maison')}">${item.im.toFixed(2)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(item.ir, 'recipient')}">${item.ir.toFixed(2)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(item.ipp, 'pondoir')}">${item.ipp.toFixed(2)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${getIndiceClass(item.icn, 'maison')}">${item.icn.toFixed(2)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-800">${item.iap_bg.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-pink-800">${item.iap_prokopack.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Mettre à jour les informations de pagination
function updatePaginationInfo() {
    const totalResults = filteredData.length;
    const maxPages = Math.ceil(totalResults / rowsPerPage);
    const startResult = (currentPage - 1) * rowsPerPage + 1;
    const endResult = Math.min(currentPage * rowsPerPage, totalResults);
    
    // Informations sur les résultats
    const infoResultats = document.getElementById('info-resultats');
    if (infoResultats) {
        infoResultats.textContent = `Affichage de ${startResult}-${endResult} sur ${totalResults} résultats`;
    }
    
    const totalResultats = document.getElementById('total-resultats');
    if (totalResultats) {
        totalResultats.textContent = `Total: ${totalResults} résultats`;
    }
    
    // Informations de pagination
    const infoPagination = document.getElementById('info-pagination');
    if (infoPagination) {
        infoPagination.textContent = `Page ${currentPage} sur ${maxPages || 1}`;
    }
    
    // Boutons de pagination
    const btnPrecedent = document.getElementById('btn-precedent');
    if (btnPrecedent) {
        btnPrecedent.disabled = currentPage <= 1;
    }
    
    const btnSuivant = document.getElementById('btn-suivant');
    if (btnSuivant) {
        btnSuivant.disabled = currentPage >= maxPages;
    }
}

// Initialiser la pagination
function initializePagination() {
    currentPage = 1;
    updatePaginationInfo();
}

// Réinitialiser tous les filtres
function resetFilters() {
    // Réinitialiser les valeurs
    const filtreMois = document.getElementById('filtre-mois');
    if (filtreMois) filtreMois.value = '';
    
    const filtreSecteur = document.getElementById('filtre-secteur');
    if (filtreSecteur) filtreSecteur.value = '';
    
    const recherche = document.getElementById('recherche-indices');
    if (recherche) recherche.value = '';
    
    // Réinitialiser la pagination
    currentPage = 1;
    
    // Réappliquer les filtres
    applyFiltersAndPagination();
    
    console.log('🔄 Filtres réinitialisés');
}
