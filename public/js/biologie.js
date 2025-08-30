// JavaScript pour la page Biologie Moléculaire - Centre MURAZ
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧬 Page Biologie Moléculaire Centre MURAZ chargée !');
    
    // Données de démonstration
    const demoData = generateDemoData();
    
    // Initialisation des graphiques
    initializeCharts(demoData);
    
    // Initialisation des tableaux
    populateTables(demoData);
    
    // Initialisation des statistiques
    updateStats(demoData);
    
    console.log('✅ Page Biologie Moléculaire initialisée avec succès !');
});

// Génération de données de démonstration
function generateDemoData() {
    return {

        
        // Données RT-PCR Virus
        rtPcrVirus: [
            {
                date: '2024-01-15',
                espece: 'Aedes aegypti',
                idPrelevement: 'COL-2024-005',
                virus: 'Dengue',
                resultat: 'Positif',
                chargeVirale: 1250.5,
                secteur: 'Secteur A'
            },
            {
                date: '2024-01-20',
                espece: 'Aedes aegypti',
                idPrelevement: 'COL-2024-006',
                virus: 'Zika',
                resultat: 'Positif',
                chargeVirale: 890.2,
                secteur: 'Secteur B'
            },
            {
                date: '2024-02-01',
                espece: 'Culex quinquefasciatus',
                idPrelevement: 'COL-2024-007',
                virus: 'West Nile',
                resultat: 'Positif',
                chargeVirale: 567.8,
                secteur: 'Secteur A'
            },
            {
                date: '2024-02-10',
                espece: 'Aedes albopictus',
                idPrelevement: 'COL-2024-008',
                virus: 'Chikungunya',
                resultat: 'Positif',
                chargeVirale: 2340.1,
                secteur: 'Secteur C'
            }
        ],
        
        // Données PCR Repas de Sang
        pcrBloodMeal: [
            {
                date: '2024-01-15',
                espece: 'Aedes aegypti',
                idPrelevement: 'COL-2024-009',
                origine: 'Mixte',
                especeAnimale: 'Bovin',
                pourcentageHumain: 60.0,
                pourcentageAnimal: 40.0,
                secteur: 'Secteur A'
            },
            {
                date: '2024-01-20',
                espece: 'Aedes aegypti',
                idPrelevement: 'COL-2024-010',
                origine: 'Humain',
                especeAnimale: 'N/A',
                pourcentageHumain: 100.0,
                pourcentageAnimal: 0.0,
                secteur: 'Secteur B'
            },
            {
                date: '2024-02-01',
                espece: 'Culex quinquefasciatus',
                idPrelevement: 'COL-2024-011',
                origine: 'Animal',
                especeAnimale: 'Poulet',
                pourcentageHumain: 0.0,
                pourcentageAnimal: 100.0,
                secteur: 'Secteur A'
            },
            {
                date: '2024-02-10',
                espece: 'Aedes albopictus',
                idPrelevement: 'COL-2024-012',
                origine: 'Mixte',
                especeAnimale: 'Ovin',
                pourcentageHumain: 45.0,
                pourcentageAnimal: 55.0,
                secteur: 'Secteur C'
            }
        ]
    };
}

// Initialisation des graphiques
function initializeCharts(data) {

    
    // Graphique des virus détectés
    const virusDetectionCtx = document.getElementById('virusDetectionChart');
    if (virusDetectionCtx) {
        new Chart(virusDetectionCtx, {
            type: 'bar',
            data: {
                labels: ['Dengue', 'Zika', 'Chikungunya', 'West Nile'],
                datasets: [{
                    label: 'Nombre de Détections',
                    data: [12, 8, 6, 4],
                    backgroundColor: [
                        '#ef4444', // Red
                        '#f59e0b', // Orange
                        '#10b981', // Green
                        '#3b82f6'  // Blue
                    ],
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Nombre de Détections'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Graphique de la distribution des charges virales
    const viralLoadCtx = document.getElementById('viralLoadChart');
    if (viralLoadCtx) {
        new Chart(viralLoadCtx, {
            type: 'histogram',
            data: {
                labels: ['0-500', '500-1000', '1000-1500', '1500-2000', '2000+'],
                datasets: [{
                    label: 'Nombre d\'Échantillons',
                    data: [5, 8, 12, 6, 3],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3b82f6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Nombre d\'Échantillons'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Charge Virale (copies/mL)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Graphique de l'origine des repas de sang
    const bloodMealOriginCtx = document.getElementById('bloodMealOriginChart');
    if (bloodMealOriginCtx) {
        new Chart(bloodMealOriginCtx, {
            type: 'pie',
            data: {
                labels: ['Humain', 'Animal', 'Mixte'],
                datasets: [{
                    data: [35, 25, 40],
                    backgroundColor: [
                        '#10b981', // Green
                        '#f59e0b', // Orange
                        '#8b5cf6'  // Purple
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
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Graphique des espèces animales
    const animalSpeciesCtx = document.getElementById('animalSpeciesChart');
    if (animalSpeciesCtx) {
        new Chart(animalSpeciesCtx, {
            type: 'bar',
            data: {
                labels: ['Bovin', 'Ovin', 'Poulet', 'Porc', 'Autres'],
                datasets: [{
                    label: 'Nombre d\'Analyses',
                    data: [8, 6, 12, 4, 3],
                    backgroundColor: [
                        '#8b5cf6', // Purple
                        '#3b82f6', // Blue
                        '#10b981', // Green
                        '#f59e0b', // Orange
                        '#6b7280'  // Gray
                    ],
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Nombre d\'Analyses'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Remplissage des tableaux avec les données
function populateTables(data) {

    
    // Tableau RT-PCR Virus
    const virusTable = document.getElementById('rt-pcr-virus-table');
    if (virusTable) {
        virusTable.innerHTML = data.rtPcrVirus.map(item => `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-700">${formatDate(item.date)}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.espece}</td>
                <td class="px-4 py-3 text-sm font-mono text-blue-600">${item.idPrelevement}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.virus}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                        item.resultat === 'Positif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${item.resultat}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.chargeVirale.toLocaleString()}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.secteur}</td>
            </tr>
        `).join('');
    }
    
    // Tableau PCR Repas de Sang
    const bloodMealTable = document.getElementById('pcr-blood-meal-table');
    if (bloodMealTable) {
        bloodMealTable.innerHTML = data.pcrBloodMeal.map(item => `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="px-4 py-3 text-sm text-gray-700">${formatDate(item.date)}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.espece}</td>
                <td class="px-4 py-3 text-sm font-mono text-blue-600">${item.idPrelevement}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                        item.origine === 'Humain' ? 'bg-green-100 text-green-800' :
                        item.origine === 'Animal' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                    }">
                        ${item.origine}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.especeAnimale}</td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.pourcentageHumain}%</td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.pourcentageAnimal}%</td>
                <td class="px-4 py-3 text-sm text-gray-700">${item.secteur}</td>
            </tr>
        `).join('');
    }
}

// Mise à jour des statistiques
function updateStats(data) {
    // Total PCR (supprimé - section PCR alléliques retirée)
    const totalPcr = document.getElementById('total-pcr');
    if (totalPcr) {
        totalPcr.textContent = '0';
    }
    
    // Total Virus
    const totalVirus = document.getElementById('total-virus');
    if (totalVirus) {
        totalVirus.textContent = data.rtPcrVirus.length;
    }
    
    // Total Repas
    const totalRepas = document.getElementById('total-repas');
    if (totalRepas) {
        totalRepas.textContent = data.pcrBloodMeal.length;
    }
    
    // Total Résistance (section PCR alléliques supprimée)
    const totalResistance = document.getElementById('total-resistance');
    if (totalResistance) {
        totalResistance.textContent = '0';
    }
}

// Fonction de formatage de date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ===== FONCTIONS DE FILTRAGE ET EXPORT =====

// Application des filtres
function appliquerFiltres() {
    const espece = document.getElementById('filter-espece').value;
    const secteur = document.getElementById('filter-secteur').value;
    const dateDebut = document.getElementById('filter-date-debut').value;
    const dateFin = document.getElementById('filter-date-fin').value;
    
    // Ici, vous pourriez filtrer les données selon les critères
    // Pour l'instant, on affiche juste une notification
    showNotification(`Filtres appliqués : Espèce=${espece}, Secteur=${secteur}, Période=${dateDebut} à ${dateFin}`, 'info');
    
    // TODO: Implémenter le filtrage réel des données et graphiques
}

// Réinitialisation des filtres
function reinitialiserFiltres() {
    document.getElementById('filter-espece').value = '';
    document.getElementById('filter-secteur').value = '';
    document.getElementById('filter-date-debut').value = '';
    document.getElementById('filter-date-fin').value = '';
    
    showNotification('Filtres réinitialisés', 'info');
    
    // TODO: Recharger toutes les données
}

// Export des données
function exporterDonnees() {
    // Création d'un fichier CSV avec toutes les données
    const csvContent = generateCSV();
    
    // Téléchargement du fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `centre_muraz_biologie_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Données exportées avec succès !', 'success');
}

// Génération du CSV
function generateCSV() {
    const data = generateDemoData();
    let csv = 'Type,Date,Espèce,Gène/Virus/Origine,Résultat,Charge Virale,% Résistance,% Humain,% Animal,Secteur\n';
    
    // Données PCR Alléliques supprimées
    
    // Ajout des données RT-PCR Virus
    data.rtPcrVirus.forEach(item => {
        csv += `RT-PCR Virus,${item.date},${item.espece},${item.virus},${item.resultat},${item.chargeVirale},,,,${item.secteur}\n`;
    });
    
    // Ajout des données PCR Repas de Sang
    data.pcrBloodMeal.forEach(item => {
        csv += `PCR Repas Sang,${item.date},${item.espece},${item.origine},,${item.pourcentageHumain}%,${item.pourcentageAnimal}%,${item.secteur}\n`;
    });
    
    return csv;
}

// Fonction de notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// Animation des éléments au chargement
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observer les cartes de statistiques
document.addEventListener('DOMContentLoaded', function() {
    const statCards = document.querySelectorAll('.card.text-center');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observer les sections
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateX(-20px)';
        section.style.transition = `all 0.6s ease-out ${index * 0.2}s`;
        observer.observe(section);
    });
});
