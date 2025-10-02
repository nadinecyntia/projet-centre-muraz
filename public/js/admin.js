// ===== PAGE ADMIN - BIOLOGIE MOLÉCULAIRE =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de la page admin...');
    
    // Initialiser la page admin
    initializeAdmin();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners();
});

function initializeAdmin() {
    console.log('Initialisation de la page admin...');
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
    
    // Gestion des onglets
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
    
    console.log('✅ Tous les écouteurs d\'événements configurés');
}

// ===== GESTION DES ONGLETS =====

function switchTab(tabName) {
    console.log(`🔄 Changement d'onglet vers: ${tabName}`);
    
    // Masquer tous les contenus d'onglets
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    // Désactiver tous les boutons d'onglets
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('bg-blue-600', 'text-white');
        button.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    // Afficher le contenu de l'onglet sélectionné
    const targetContent = document.getElementById(`${tabName}-form`);
    if (targetContent) {
        targetContent.classList.remove('hidden');
        console.log(`✅ Onglet ${tabName} affiché`);
    } else {
        console.error(`❌ Contenu d'onglet ${tabName} non trouvé`);
    }
    
    // Activer le bouton de l'onglet sélectionné
    const targetButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetButton) {
        targetButton.classList.remove('bg-gray-200', 'text-gray-700');
        targetButton.classList.add('bg-blue-600', 'text-white');
        console.log(`✅ Bouton d'onglet ${tabName} activé`);
    }
}

// ===== GESTION DU FORMULAIRE =====

async function handleFormSubmit(event) {
    event.preventDefault();
    console.log('📝 Soumission du formulaire de biologie moléculaire...');
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    console.log('📊 Données du formulaire:', data);
    
    // Validation des données
    if (!validateFormData(data)) {
        return;
    }
    
    try {
        // Afficher l'indicateur de chargement
        showLoadingIndicator();
        
        // Envoyer les données au serveur
        const response = await fetch('/api/biologie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
            const result = await response.json();
        
        if (result.success) {
            console.log('✅ Données enregistrées avec succès:', result);
            showNotification('✅ Données de biologie moléculaire enregistrées avec succès!', 'success');
            
            // Réinitialiser le formulaire
            event.target.reset();
            
        } else {
            console.error('❌ Erreur lors de l\'enregistrement:', result);
            showNotification(`❌ Erreur: ${result.message}`, 'error');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la soumission:', error);
        showNotification('❌ Erreur de connexion lors de l\'enregistrement', 'error');
    } finally {
        // Masquer l'indicateur de chargement
        hideLoadingIndicator();
    }
}

function validateFormData(data) {
    console.log('🔍 Validation des données du formulaire...');
    
    const requiredFields = [
        'analysis_type',
        'mosquito_genus',
        'mosquito_species',
        'sector',
        'sample_count',
        'collection_date',
        'analysis_date'
    ];
    
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            console.error(`❌ Champ requis manquant: ${field}`);
            showNotification(`❌ Le champ ${field} est requis`, 'error');
            return false;
        }
    }
    
    console.log('✅ Validation réussie');
    return true;
}

// ===== INDICATEURS DE CHARGEMENT =====

function showLoadingIndicator() {
    const submitButton = document.querySelector('#biologie-form button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enregistrement...';
    }
}

function hideLoadingIndicator() {
    const submitButton = document.querySelector('#biologie-form button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-save mr-2"></i>Enregistrer';
    }
}

// ===== NOTIFICATIONS =====

function showNotification(message, type = 'info') {
    console.log(`📢 Notification [${type}]: ${message}`);
    
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300 transform translate-x-full`;
    
    // Couleurs selon le type
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    
    // Icône selon le type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="${icons[type] || icons.info} mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Suppression automatique après 5 secondes
    setTimeout(() => {
        notification.classList.add('translate-x-full');
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
        }, 300);
    }, 5000);
}

// ===== AUTHENTIFICATION =====

// Vérifier l'authentification
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const result = await response.json();
        
        if (!result.authenticated) {
            window.location.href = '/login';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error);
        window.location.href = '/login';
        return false;
    }
}

// Initialiser la vérification d'authentification
checkAuth();