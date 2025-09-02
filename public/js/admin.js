// Admin.js - Gestion de la page admin
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la page
    initializeAdmin();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners();
});

function initializeAdmin() {
    console.log('Initialisation de la page admin...');
    
    // Initialiser la synchronisation KoboCollect
    initializeSync();
}

function setupEventListeners() {
    console.log('🔧 Configuration des écouteurs d\'événements...');
    
    // Gestion du formulaire de biologie moléculaire
    const form = document.getElementById('biologie-form');
    console.log('📝 Formulaire trouvé:', form);
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('✅ Écouteur submit ajouté au formulaire');
    } else {
        console.error('❌ Formulaire biologie-form non trouvé!');
    }
    
    // Gestion des champs conditionnels
    const sampleTypeSelect = document.getElementById('sample_type');
    if (sampleTypeSelect) {
        sampleTypeSelect.addEventListener('change', toggleFields);
        console.log('✅ Écouteur change ajouté au select sample_type');
    } else {
        console.error('❌ Select sample_type non trouvé!');
    }
    

}

// Gestion de la soumission du formulaire
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    console.log('Données du formulaire:', data);
    
    // Récupérer le bouton et sauvegarder le texte original
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Afficher un indicateur de chargement
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enregistrement...';
        submitBtn.disabled = true;
        
        // Envoyer les données au serveur
        const response = await fetch('/api/biologie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Données enregistrées avec succès!', 'success');
            event.target.reset();
        } else {
            const error = await response.json();
            showNotification(`❌ Erreur: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        showNotification('❌ Erreur de connexion au serveur', 'error');
    } finally {
        // Restaurer le bouton
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Affichage des champs conditionnels selon le type d'analyse
function toggleFields() {
    const sampleType = document.getElementById('sample_type').value;
    
    // Masquer tous les champs spécifiques
    const specificFields = [
        'rt_pcr_virus_fields',
        'pcr_allelic_fields',
        'pcr_blood_meal_fields'
    ];
    
    specificFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.add('hidden');
        }
    });
    
    // Afficher les champs appropriés
    if (sampleType === 'rt_pcr_virus') {
        const field = document.getElementById('rt_pcr_virus_fields');
        if (field) field.classList.remove('hidden');
    } else if (sampleType === 'pcr_allelic') {
        const field = document.getElementById('pcr_allelic_fields');
        if (field) field.classList.remove('hidden');
    } else if (sampleType === 'pcr_blood_meal') {
        const field = document.getElementById('pcr_blood_meal_fields');
        if (field) field.classList.remove('hidden');
    }
}



// ===== NOTIFICATIONS =====

function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Ajouter à la page
    document.body.appendChild(notification);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Notification d'actions rapides après une synchro réussie
function showSyncActions(detailMsg = '') {
    const container = document.createElement('div');
    container.className = 'fixed bottom-4 right-4 z-50 max-w-md w-full';

    container.innerHTML = `
        <div class="bg-white shadow-xl rounded-lg border border-gray-200 p-4">
            <div class="flex items-start gap-3">
                <div class="text-green-600">
                    <i class="fas fa-check-circle text-2xl"></i>
                </div>
                <div class="flex-1">
                    <p class="text-gray-800 font-semibold mb-1">Synchronisation terminée</p>
                    <p class="text-sm text-gray-600 mb-3">${detailMsg || 'Succès'}</p>
                    <div class="flex gap-2">
                        <a href="/analyses" target="_blank" class="px-3 py-2 bg-muraz-orange text-white rounded hover:opacity-90 transition text-sm">
                            <i class="fas fa-chart-bar mr-1"></i> Ouvrir Analyses
                        </a>
                        <a href="/indices" target="_blank" class="px-3 py-2 bg-muraz-green text-white rounded hover:opacity-90 transition text-sm">
                            <i class="fas fa-chart-line mr-1"></i> Ouvrir Indices
                        </a>
                    </div>
                </div>
                <button class="text-gray-400 hover:text-gray-600" aria-label="Fermer" onclick="this.closest('.fixed').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    setTimeout(() => {
        if (container.parentElement) container.remove();
    }, 7000);
}

// ===== AUTHENTIFICATION =====



// ===== SYNCHRONISATION KOBCOLLECT =====

// Initialiser la synchronisation
function initializeSync() {
    console.log('🔄 Initialisation de la synchronisation KoboCollect...');
    
    // Vérifier le statut initial
    checkSyncStatus();
    
    // Ajouter les écouteurs pour les boutons de synchronisation
    setupSyncEventListeners();
}

// Configurer les écouteurs d'événements pour la synchronisation
function setupSyncEventListeners() {
    // Synchronisation complète
    const syncCompleteBtn = document.getElementById('sync-complete');
    if (syncCompleteBtn) {
        syncCompleteBtn.addEventListener('click', () => synchronizeKoboCollect('complete'));
    }
    
    // Synchronisation par type
    const syncLarvesBtn = document.getElementById('sync-larves');
    if (syncLarvesBtn) {
        syncLarvesBtn.addEventListener('click', () => synchronizeKoboCollect('larves'));
    }
    
    const syncOeufsBtn = document.getElementById('sync-oeufs');
    if (syncOeufsBtn) {
        syncOeufsBtn.addEventListener('click', () => synchronizeKoboCollect('oeufs'));
    }
    
    const syncAdultesBtn = document.getElementById('sync-adultes');
    if (syncAdultesBtn) {
        syncAdultesBtn.addEventListener('click', () => synchronizeKoboCollect('adultes'));
    }
    
    // Boutons utilitaires
    const clearLogsBtn = document.getElementById('clear-logs');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', clearSyncLogs);
    }
    
    const refreshStatusBtn = document.getElementById('refresh-status');
    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', checkSyncStatus);
    }
    
    // Boutons de rafraîchissement des graphiques
    const refreshAnalysesBtn = document.getElementById('refresh-analyses');
    if (refreshAnalysesBtn) {
        refreshAnalysesBtn.addEventListener('click', refreshAnalysesPage);
    }
    
    const refreshIndicesBtn = document.getElementById('refresh-indices');
    if (refreshIndicesBtn) {
        refreshIndicesBtn.addEventListener('click', refreshIndicesPage);
    }
}

// Vérifier le statut de la synchronisation
async function checkSyncStatus() {
    try {
        const response = await fetch('/api/sync/status');
        const result = await response.json();
        
        updateSyncStatus(result);
    } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        updateSyncStatus({ status: 'error', message: 'Erreur de connexion' });
    }
}

// Mettre à jour l'affichage du statut
function updateSyncStatus(data) {
    const statusElement = document.getElementById('sync-status');
    if (!statusElement) return;
    
    if (data.status === 'success') {
        statusElement.innerHTML = `
            <div class="text-green-600 mb-2">
                <i class="fas fa-check-circle text-3xl"></i>
            </div>
            <p class="text-green-700 font-semibold">Synchronisation à jour</p>
            <p class="text-sm text-gray-600">Dernière sync: ${data.lastSync || 'N/A'}</p>
        `;
    } else if (data.status === 'error') {
        statusElement.innerHTML = `
            <div class="text-red-600 mb-2">
                <i class="fas fa-exclamation-triangle text-3xl"></i>
            </div>
            <p class="text-red-700 font-semibold">Erreur de synchronisation</p>
            <p class="text-sm text-gray-600">${data.message || 'Erreur inconnue'}</p>
        `;
    } else {
        statusElement.innerHTML = `
            <div class="text-yellow-600 mb-2">
                <i class="fas fa-clock text-3xl"></i>
            </div>
            <p class="text-yellow-700 font-semibold">Synchronisation en cours...</p>
            <p class="text-sm text-gray-600">Veuillez patienter</p>
        `;
    }
}

// Lancer la synchronisation
async function synchronizeKoboCollect(type = 'complete') {
    try {
        console.log(`🔄 Début de la synchronisation KoboCollect: ${type}`);
        
        // Mettre à jour le statut
        updateSyncStatus({ status: 'syncing' });
        addSyncLog(`🔄 Début de la synchronisation ${type}...`);
        
        // Désactiver les boutons pendant la synchronisation
        disableSyncButtons(true);
        
        // Appeler l'API de synchronisation
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: type })
        });
        
        console.log('📡 Réponse du serveur:', response.status, response.statusText);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Résultat de la synchronisation:', result);
            console.log('📊 Détails de la réponse:', {
                success: result.success,
                message: result.message,
                type: result.type,
                result: result.result,
                timestamp: result.timestamp
            });

            // Extraire les compteurs traités/erreurs selon le type de réponse
            const processed = result.result?.processedCount ?? 0;
            const errors = result.result?.errorCount ?? 0;

            const detailMsg = `traités: ${processed}, erreurs: ${errors}`;

            // Cas déjà à jour (aucune nouvelle donnée, aucune erreur)
            if (processed === 0 && errors === 0) {
                addSyncLog(`ℹ️ Synchronisation ${type}: déjà à jour (aucune nouvelle donnée)`);
                showNotification('ℹ️ Synchronisation déjà effectuée, aucune nouvelle donnée', 'info');
                updateSyncStatus({ status: 'success', lastSync: result.timestamp, detail: 'déjà à jour' });
            } else {
                addSyncLog(`✅ Synchronisation ${type} réussie: ${result.message || 'Succès'} (${detailMsg})`);
                showNotification(`✅ Synchronisation ${type} réussie (${detailMsg})`, 'success');
                // Mettre à jour le statut avec détail
                updateSyncStatus({ status: 'success', lastSync: result.timestamp, detail: detailMsg });
                // Afficher les actions rapides (ouvrir Analyses/Indices)
                showSyncActions(detailMsg);
            }

            // Vérifier le nouveau statut après un délai
            setTimeout(checkSyncStatus, 1000);
            
        } else {
            let errorMessage = 'Erreur inconnue';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || 'Erreur serveur';
                console.error('❌ Détails de l\'erreur:', errorData);
            } catch (parseError) {
                errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
                console.error('❌ Erreur lors du parsing de la réponse:', parseError);
            }
            
            addSyncLog(`❌ Erreur de synchronisation ${type}: ${errorMessage}`);
            showNotification(`❌ Erreur de synchronisation: ${errorMessage}`, 'error');
            
            // Mettre à jour le statut d'erreur
            updateSyncStatus({ status: 'error', message: errorMessage });
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        
        const errorMessage = error.message || 'Erreur de connexion inconnue';
        addSyncLog(`❌ Erreur de connexion: ${errorMessage}`);
        showNotification(`❌ Erreur de connexion: ${errorMessage}`, 'error');
        
        // Mettre à jour le statut d'erreur
        updateSyncStatus({ status: 'error', message: errorMessage });
        
        } finally {
        // Réactiver les boutons
        disableSyncButtons(false);
    }
}

// Désactiver/Réactiver les boutons de synchronisation
function disableSyncButtons(disabled) {
    const buttons = ['sync-complete', 'sync-larves', 'sync-oeufs', 'sync-adultes'];
    buttons.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.disabled = disabled;
            if (disabled) {
                button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Synchronisation...';
            } else {
                // Restaurer le texte original selon le type
                if (id === 'sync-complete') {
                    button.innerHTML = '<i class="fas fa-sync mr-2"></i>Lancer la Synchronisation';
                } else if (id === 'sync-larves') {
                    button.innerHTML = '<i class="fas fa-bug mr-2"></i>Larves et Gîtes';
                } else if (id === 'sync-oeufs') {
                    button.innerHTML = '<i class="fas fa-egg mr-2"></i>Œufs';
                } else if (id === 'sync-adultes') {
                    button.innerHTML = '<i class="fas fa-mosquito mr-2"></i>Moustiques Adultes';
                }
            }
        }
    });
}

// Ajouter un log de synchronisation
function addSyncLog(message) {
    const logsElement = document.getElementById('sync-logs');
    if (!logsElement) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.innerHTML = `<span class="text-gray-400">[${timestamp}]</span> ${message}`;
    
    logsElement.appendChild(logEntry);
    logsElement.scrollTop = logsElement.scrollHeight;
}

// Effacer les logs de synchronisation
function clearSyncLogs() {
    const logsElement = document.getElementById('sync-logs');
    if (logsElement) {
        logsElement.innerHTML = '<div class="text-gray-500">Logs effacés...</div>';
    }
}

// Rafraîchir la page Analyses
async function refreshAnalysesPage() {
    try {
        console.log('🔄 Rafraîchissement de la page Analyses...');
        
        // Désactiver le bouton pendant le rafraîchissement
        const btn = document.getElementById('refresh-analyses');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Rafraîchissement...';
        btn.disabled = true;
        
        // Appeler l'API pour rafraîchir les données
        const response = await fetch('/api/analyses');
        if (response.ok) {
            showNotification('✅ Page Analyses rafraîchie avec succès!', 'success');
            
            // Ouvrir la page Analyses dans un nouvel onglet
            window.open('/analyses', '_blank');
        } else {
            showNotification('❌ Erreur lors du rafraîchissement des Analyses', 'error');
        }
        
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des Analyses:', error);
        showNotification('❌ Erreur de connexion lors du rafraîchissement', 'error');
    } finally {
        // Restaurer le bouton
        const btn = document.getElementById('refresh-analyses');
        btn.innerHTML = '<i class="fas fa-chart-bar mr-2"></i>Rafraîchir Analyses';
        btn.disabled = false;
    }
}

// Rafraîchir la page Indices
async function refreshIndicesPage() {
    try {
        console.log('🔄 Rafraîchissement de la page Indices...');
        
        // Désactiver le bouton pendant le rafraîchissement
        const btn = document.getElementById('refresh-indices');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Rafraîchissement...';
        btn.disabled = true;
        
        // Appeler l'API pour rafraîchir les données
        const response = await fetch('/api/indices');
        if (response.ok) {
            showNotification('✅ Page Indices rafraîchie avec succès!', 'success');
            
            // Ouvrir la page Indices dans un nouvel onglet
            window.open('/indices', '_blank');
        } else {
            showNotification('❌ Erreur lors du rafraîchissement des Indices', 'error');
        }
        
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des Indices:', error);
        showNotification('❌ Erreur de connexion lors du rafraîchissement', 'error');
    } finally {
        // Restaurer le bouton
        const btn = document.getElementById('refresh-indices');
        btn.innerHTML = '<i class="fas fa-chart-line mr-2"></i>Rafraîchir Indices';
        btn.disabled = false;
    }
}

// ===== FONCTIONS POUR LES NOUVEAUX FORMULAIRES D'ANALYSES LABORATOIRES =====

// Fonction pour ouvrir le formulaire PCR et RT-PCR
function openPCRForm() {
    console.log('🔵 Ouverture du formulaire PCR et RT-PCR...');
    
    // Masquer tous les formulaires
    hideAllForms();
    
    // Afficher le formulaire PCR
    const pcrForm = document.getElementById('pcr-form');
    if (pcrForm) {
        pcrForm.classList.remove('hidden');
        pcrForm.scrollIntoView({ behavior: 'smooth' });
        console.log('✅ Formulaire PCR affiché');
    } else {
        console.error('❌ Formulaire PCR non trouvé');
    }
}

// Fonction pour fermer le formulaire PCR et RT-PCR
function closePCRForm() {
    console.log('🔵 Fermeture du formulaire PCR et RT-PCR...');
    
    const pcrForm = document.getElementById('pcr-form');
    if (pcrForm) {
        pcrForm.classList.add('hidden');
        console.log('✅ Formulaire PCR masqué');
    }
}

// Fonction pour ouvrir le formulaire Bioessai
function openBioessaiForm() {
    console.log('🟢 Ouverture du formulaire Bioessai...');
    
    // Masquer tous les formulaires
    hideAllForms();
    
    // Afficher le formulaire Bioessai
    const bioForm = document.getElementById('bioessai-form');
    if (bioForm) {
        bioForm.classList.remove('hidden');
        bioForm.scrollIntoView({ behavior: 'smooth' });
        console.log('✅ Formulaire Bioessai affiché');
    } else {
        console.error('❌ Formulaire Bioessai non trouvé');
    }
}

// Fonction pour fermer le formulaire Bioessai
function closeBioessaiForm() {
    console.log('🟢 Fermeture du formulaire Bioessai...');
    
    const bioForm = document.getElementById('bioessai-form');
    if (bioForm) {
        bioForm.classList.add('hidden');
        console.log('✅ Formulaire Bioessai masqué');
    }
}

// Fonction pour ouvrir le formulaire Origine Repas Sanguin
function openRepasForm() {
    console.log('🟣 Ouverture du formulaire Origine Repas Sanguin...');
    
    // Masquer tous les formulaires
    hideAllForms();
    
    // Afficher le formulaire Repas
    const repasForm = document.getElementById('repas-form');
    if (repasForm) {
        repasForm.classList.remove('hidden');
        repasForm.scrollIntoView({ behavior: 'smooth' });
        console.log('✅ Formulaire Repas affiché');
    } else {
        console.error('❌ Formulaire Repas non trouvé');
    }
}

// Fonction pour fermer le formulaire Origine Repas Sanguin
function closeRepasForm() {
    console.log('🟣 Fermeture du formulaire Origine Repas Sanguin...');
    
    const repasForm = document.getElementById('repas-form');
    if (repasForm) {
        repasForm.classList.add('hidden');
        console.log('✅ Formulaire Repas masqué');
    }
}

// Fonction pour masquer tous les formulaires
function hideAllForms() {
    const forms = ['pcr-form', 'bioessai-form', 'repas-form'];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.classList.add('hidden');
        }
    });
    
    console.log('🔒 Tous les formulaires masqués');
}

// Gestion des soumissions des nouveaux formulaires
document.addEventListener('DOMContentLoaded', function() {
    // Formulaire PCR et RT-PCR
    const pcrForm = document.getElementById('pcr-form-data');
    if (pcrForm) {
        pcrForm.addEventListener('submit', handlePCRFormSubmit);
        console.log('✅ Écouteur submit ajouté au formulaire PCR');
    }
    
    // Formulaire Bioessai
    const bioForm = document.getElementById('bioessai-form-data');
    if (bioForm) {
        bioForm.addEventListener('submit', handleBioessaiFormSubmit);
        console.log('✅ Écouteur submit ajouté au formulaire Bioessai');
    }
    
    // Formulaire Origine Repas Sanguin
    const repasForm = document.getElementById('repas-form-data');
    if (repasForm) {
        repasForm.addEventListener('submit', handleRepasFormSubmit);
        console.log('✅ Écouteur submit ajouté au formulaire Repas');
    }
});

// Gestion de la soumission du formulaire PCR et RT-PCR
async function handlePCRFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    console.log('🔵 Données du formulaire PCR:', data);
    
    try {
        const response = await fetch('/api/biologie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                form_type: 'pcr_rt_pcr'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Analyse PCR/RT-PCR enregistrée avec succès!', 'success');
            event.target.reset();
            closePCRForm();
        } else {
            const error = await response.json();
            showNotification(`❌ Erreur: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement PCR:', error);
        showNotification('❌ Erreur de connexion au serveur', 'error');
    }
}

// Gestion de la soumission du formulaire Bioessai
async function handleBioessaiFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    console.log('🟢 Données du formulaire Bioessai:', data);
    
    try {
        const response = await fetch('/api/biologie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                form_type: 'bioessai'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Analyse Bioessai enregistrée avec succès!', 'success');
            event.target.reset();
            closeBioessaiForm();
        } else {
            const error = await response.json();
            showNotification(`❌ Erreur: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement Bioessai:', error);
        showNotification('❌ Erreur de connexion au serveur', 'error');
    }
}

// Gestion de la soumission du formulaire Origine Repas Sanguin
async function handleRepasFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    console.log('🟣 Données du formulaire Repas:', data);
    
    try {
        const response = await fetch('/api/biologie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                form_type: 'origine_repas_sanguin'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('✅ Analyse Origine Repas Sanguin enregistrée avec succès!', 'success');
            event.target.reset();
            closeRepasForm();
        } else {
            const error = await response.json();
            showNotification(`❌ Erreur: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement Repas:', error);
        showNotification('❌ Erreur de connexion au serveur', 'error');
    }
}

// Afficher les actions rapides (ouvrir Analyses/Indices)
function showSyncActions(detailMsg) {
    const actionsElement = document.getElementById('sync-actions');
    if (!actionsElement) return;

    actionsElement.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">Actions Rapides</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onclick="openPCRForm()" class="bg-blue-500 text-white p-2 rounded-md flex items-center justify-center">
                <i class="fas fa-flask mr-2"></i>Analyses
            </button>
            <button onclick="openBioessaiForm()" class="bg-green-500 text-white p-2 rounded-md flex items-center justify-center">
                <i class="fas fa-vial mr-2"></i>Indices
            </button>
            <button onclick="openRepasForm()" class="bg-purple-500 text-white p-2 rounded-md flex items-center justify-center">
                <i class="fas fa-chart-bar mr-2"></i>Repas
            </button>
        </div>
        <p class="text-sm text-gray-600 mt-2">${detailMsg}</p>
    `;
    actionsElement.classList.remove('hidden');
}
