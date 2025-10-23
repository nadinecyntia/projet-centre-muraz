/**
 * =============================================================================
 * Import Manager - CSV/Excel Import System
 * =============================================================================
 * Gère l'import de données à partir de fichiers CSV et Excel
 * Compatible avec la structure normalisée de la base de données
 */

class ImportManager {
    constructor() {
        this.currentFile = null;
        this.currentType = null;
        this.previewData = null;
        this.init();
    }

    /**
     * Initialisation
     */
    init() {
        console.log('📊 ImportManager: Initialisation...');
        this.attachEventListeners();
    }

    /**
     * Attacher les événements
     */
    attachEventListeners() {
        // Bouton principal d'import
        const importBtn = document.getElementById('importDataBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.openModal());
        }

        // Boutons du modal
        const closeBtn = document.getElementById('closeImportModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        const cancelBtn = document.getElementById('cancelImportBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Bouton téléchargement template
        const downloadBtn = document.getElementById('downloadTemplateBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadTemplate());
        }

        // Bouton prévisualisation
        const previewBtn = document.getElementById('previewFileBtn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewFile());
        }

        // Bouton import
        const executeBtn = document.getElementById('executeImportBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeImport());
        }

        // File input change
        const fileInput = document.getElementById('importFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Drag & Drop Zone
        const dropZone = document.getElementById('fileDropZone');
        if (dropZone) {
            dropZone.addEventListener('click', () => {
                document.getElementById('importFile').click();
            });

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    const fileInput = document.getElementById('importFile');
                    fileInput.files = files;
                    this.handleFileSelect({ target: fileInput });
                }
            });
        }

        console.log('✅ ImportManager: Événements attachés');
    }

    /**
     * Ouvrir le modal
     */
    openModal() {
        console.log('📂 Ouverture du modal d\'import');
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.style.display = 'block';
            this.resetForm();
        }
    }

    /**
     * Fermer le modal
     */
    closeModal() {
        console.log('✖️ Fermeture du modal d\'import');
        const modal = document.getElementById('importModal');
        if (modal) {
            modal.style.display = 'none';
            this.resetForm();
        }
    }

    /**
     * Réinitialiser le formulaire
     */
    resetForm() {
        this.currentFile = null;
        this.currentType = null;
        this.previewData = null;

        const fileInput = document.getElementById('importFile');
        const typeSelect = document.getElementById('importDataType');
        const previewDiv = document.getElementById('previewResults');
        const resultsDiv = document.getElementById('importResults');

        if (fileInput) fileInput.value = '';
        if (typeSelect) typeSelect.value = '';
        if (previewDiv) previewDiv.innerHTML = '';
        if (resultsDiv) resultsDiv.innerHTML = '';

        // Réinitialiser le drop zone
        const dropZoneContent = document.getElementById('dropZoneContent');
        const fileSelectedInfo = document.getElementById('fileSelectedInfo');
        if (dropZoneContent) dropZoneContent.style.display = 'block';
        if (fileSelectedInfo) fileSelectedInfo.style.display = 'none';

        // Réinitialiser le stepper
        this.updateStepper(1);

        // Afficher step 1
        document.getElementById('step1')?.classList.remove('hidden');
        document.getElementById('step3')?.classList.add('hidden');
    }

    /**
     * Gérer la sélection de fichier
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('📁 Fichier sélectionné:', file.name, 'Type:', file.type, 'Taille:', file.size);
            
            // Vérifier le type de fichier
            const validTypes = [
                'text/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            
            const validExtensions = ['.csv', '.xls', '.xlsx'];
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            
            if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
                alert('❌ Format de fichier non supporté. Utilisez CSV, XLS ou XLSX.');
                e.target.value = '';
                return;
            }
            
            this.currentFile = file;
            this.updateFileDisplay(file);
            console.log('✅ Fichier valide');
        }
    }

    /**
     * Mettre à jour l'affichage du fichier sélectionné
     */
    updateFileDisplay(file) {
        const dropZoneContent = document.getElementById('dropZoneContent');
        const fileSelectedInfo = document.getElementById('fileSelectedInfo');
        
        if (dropZoneContent) dropZoneContent.style.display = 'none';
        
        const fileSize = (file.size / 1024).toFixed(2);
        const fileIcon = file.name.endsWith('.csv') ? 'fa-file-csv' : 'fa-file-excel';
        
        if (fileSelectedInfo) {
            fileSelectedInfo.style.display = 'block';
            fileSelectedInfo.innerHTML = `
                <div class="file-selected-info fade-in">
                    <div class="file-selected-icon">
                        <i class="fas ${fileIcon}"></i>
                    </div>
                    <div class="file-selected-details">
                        <div class="file-selected-name">${file.name}</div>
                        <div class="file-selected-size">${fileSize} KB</div>
                    </div>
                    <button onclick="importManager.removeFile()" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-times-circle text-xl"></i>
                    </button>
                </div>
            `;
        }
    }

    /**
     * Supprimer le fichier sélectionné
     */
    removeFile() {
        this.currentFile = null;
        const fileInput = document.getElementById('importFile');
        if (fileInput) fileInput.value = '';
        
        const dropZoneContent = document.getElementById('dropZoneContent');
        const fileSelectedInfo = document.getElementById('fileSelectedInfo');
        
        if (dropZoneContent) dropZoneContent.style.display = 'block';
        if (fileSelectedInfo) fileSelectedInfo.style.display = 'none';
    }

    /**
     * Mettre à jour le stepper
     */
    updateStepper(step) {
        const steps = document.querySelectorAll('.import-step');
        steps.forEach((stepEl, index) => {
            const stepNumber = index + 1;
            stepEl.classList.remove('active', 'completed');
            
            if (stepNumber < step) {
                stepEl.classList.add('completed');
            } else if (stepNumber === step) {
                stepEl.classList.add('active');
            }
        });
    }

    /**
     * Télécharger un template
     */
    async downloadTemplate() {
        const type = document.getElementById('importDataType')?.value;
        
        if (!type) {
            alert('⚠️ Veuillez d\'abord sélectionner un type de données');
            return;
        }
        
        console.log('📥 Téléchargement du template:', type);
        
        try {
            const response = await fetch(`/api/import/template/${type}`);
            
            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement du template');
            }
            
            // Télécharger le fichier
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `template_${type}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('✅ Template téléchargé');
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            alert('Erreur lors du téléchargement du template: ' + error.message);
        }
    }

    /**
     * Prévisualiser le fichier
     */
    async previewFile() {
        const type = document.getElementById('importDataType')?.value;
        
        if (!this.currentFile) {
            alert('⚠️ Veuillez d\'abord sélectionner un fichier');
            return;
        }
        
        if (!type) {
            alert('⚠️ Veuillez sélectionner un type de données');
            return;
        }
        
        console.log('👁️ Prévisualisation du fichier...');
        this.showLoading(true);
        
        const formData = new FormData();
        formData.append('file', this.currentFile);
        formData.append('type', type);
        
        try {
            const response = await fetch('/api/import/preview', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Erreur de prévisualisation');
            }
            
            this.previewData = result.data;
            this.showPreview(result.data);
            
        } catch (error) {
            console.error('❌ Erreur prévisualisation:', error);
            alert('Erreur lors de la prévisualisation: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Afficher la prévisualisation
     */
    showPreview(data) {
        console.log('📊 Affichage prévisualisation:', data);
        
        this.updateStepper(2);
        
        const previewDiv = document.getElementById('previewResults');
        if (!previewDiv) return;
        
        let html = '<div class="scale-in">';
        
        // Info fichier
        html += `
            <div class="import-alert import-alert-info">
                <div class="import-alert-icon">
                    <i class="fas fa-file"></i>
                </div>
                <div class="import-alert-content">
                    <div class="import-alert-title">${this.currentFile.name}</div>
                    <div class="import-alert-message">${data.totalRows} ligne(s) détectée(s)</div>
                </div>
            </div>
        `;
        
        // Erreurs de validation
        if (!data.isValid && data.validationErrors && data.validationErrors.length > 0) {
            html += `
                <div class="import-alert import-alert-error">
                    <div class="import-alert-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="import-alert-content">
                        <div class="import-alert-title">${data.validationErrors.length} erreur(s) de validation</div>
                        <div class="import-alert-message">Veuillez corriger les erreurs avant d'importer</div>
                    </div>
                </div>
                <div class="import-error-list">
                    ${data.validationErrors.map(error => 
                        `<div class="import-error-item">
                            <i class="fas fa-times-circle"></i>
                            <span>${error}</span>
                        </div>`
                    ).join('')}
                </div>
            `;
        } else {
            html += `
                <div class="import-alert import-alert-success">
                    <div class="import-alert-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="import-alert-content">
                        <div class="import-alert-title">Données valides !</div>
                        <div class="import-alert-message">Toutes les données ont été validées avec succès</div>
                    </div>
                </div>
            `;
        }
        
        // Tableau de prévisualisation
        if (data.previewRows && data.previewRows.length > 0) {
            const columns = Object.keys(data.previewRows[0]);
            
            html += `
                <div class="mt-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <i class="fas fa-table text-blue-600"></i>
                        Aperçu des données
                    </h4>
                    <div class="overflow-x-auto">
                        <table class="import-preview-table">
                            <thead>
                                <tr>
                                    ${columns.map(col => 
                                        `<th>${col}</th>`
                                    ).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${data.previewRows.slice(0, 10).map(row => `
                                    <tr>
                                        ${columns.map(col => 
                                            `<td>${row[col] !== null && row[col] !== undefined ? row[col] : '-'}</td>`
                                        ).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${data.totalRows > 10 ? 
                        `<p class="text-sm text-gray-600 mt-3 text-center">
                            <i class="fas fa-info-circle mr-1"></i>
                            Affichage des 10 premières lignes sur ${data.totalRows} au total
                        </p>` 
                        : ''}
                </div>
            `;
        }
        
        html += '</div>';
        previewDiv.innerHTML = html;
        
        // Activer le bouton d'import seulement si les données sont valides
        const executeBtn = document.getElementById('executeImportBtn');
        if (executeBtn) {
            executeBtn.disabled = !data.isValid;
            if (data.isValid) {
                executeBtn.classList.remove('opacity-50');
            } else {
                executeBtn.classList.add('opacity-50');
            }
        }
    }

    /**
     * Exécuter l'import
     */
    async executeImport() {
        if (!this.currentFile) {
            alert('⚠️ Aucun fichier sélectionné');
            return;
        }
        
        const type = document.getElementById('importDataType')?.value;
        if (!type) {
            alert('⚠️ Type de données non sélectionné');
            return;
        }
        
        if (!this.previewData || !this.previewData.isValid) {
            alert('⚠️ Les données contiennent des erreurs. Veuillez corriger le fichier.');
            return;
        }
        
        if (!confirm(`Confirmer l'import de ${this.previewData.totalRows} enregistrement(s) ?`)) {
            return;
        }
        
        console.log('🚀 Exécution de l\'import...');
        this.showLoading(true, 'import');
        
        const formData = new FormData();
        formData.append('file', this.currentFile);
        formData.append('type', type);
        
        try {
            const response = await fetch('/api/import/execute', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Erreur d\'import');
            }
            
            this.showImportResults(result);
            
        } catch (error) {
            console.error('❌ Erreur import:', error);
            alert('Erreur lors de l\'import: ' + error.message);
        } finally {
            this.showLoading(false, 'import');
        }
    }

    /**
     * Afficher les résultats d'import
     */
    showImportResults(result) {
        console.log('📊 Résultats de l\'import:', result);
        
        this.updateStepper(3);
        
        const resultsDiv = document.getElementById('importResults');
        if (!resultsDiv) return;
        
        const stats = result.stats;
        
        let html = '<div class="scale-in">';
        
        // Alerte de succès
        html += `
            <div class="import-alert import-alert-success">
                <div class="import-alert-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="import-alert-content">
                    <div class="import-alert-title">Import terminé avec succès !</div>
                    <div class="import-alert-message">Les données ont été importées et sont en attente de validation</div>
                </div>
            </div>
        `;
        
        // Cartes statistiques
        html += `
            <div class="import-stats-grid">
                <div class="import-stat-card success">
                    <div class="import-stat-value">${stats.inserted}</div>
                    <div class="import-stat-label">
                        <i class="fas fa-check-circle mr-1"></i>Importés
                    </div>
                </div>
                <div class="import-stat-card info">
                    <div class="import-stat-value">${stats.total}</div>
                    <div class="import-stat-label">
                        <i class="fas fa-list mr-1"></i>Total traité
                    </div>
                </div>
                ${stats.skipped > 0 ? `
                    <div class="import-stat-card warning">
                        <div class="import-stat-value">${stats.skipped}</div>
                        <div class="import-stat-label">
                            <i class="fas fa-exclamation-triangle mr-1"></i>Ignorés
                        </div>
                    </div>
                ` : ''}
                ${result.errors && result.errors.length > 0 ? `
                    <div class="import-stat-card error">
                        <div class="import-stat-value">${result.errors.length}</div>
                        <div class="import-stat-label">
                            <i class="fas fa-times-circle mr-1"></i>Erreurs
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Barre de progression
        const successRate = ((stats.inserted / stats.total) * 100).toFixed(1);
        html += `
            <div class="mt-6">
                <div class="flex justify-between text-sm text-gray-700 mb-2">
                    <span>Taux de réussite</span>
                    <span class="font-semibold">${successRate}%</span>
                </div>
                <div class="import-progress-container">
                    <div class="import-progress-bar" style="width: ${successRate}%"></div>
                </div>
            </div>
        `;
        
        // Liste d'erreurs si présentes
        if (result.errors && result.errors.length > 0) {
            html += `
                <div class="mt-6">
                    <div class="import-alert import-alert-warning">
                        <div class="import-alert-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="import-alert-content">
                            <div class="import-alert-title">${result.errors.length} erreur(s) détectée(s)</div>
                            <div class="import-alert-message">Certaines lignes n'ont pas pu être importées</div>
                        </div>
                    </div>
                    <div class="import-error-list">
                        ${result.errors.map(error => 
                            `<div class="import-error-item">
                                <i class="fas fa-times-circle"></i>
                                <span>${error}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        // Bouton de fermeture
        html += `
            <div class="mt-8 text-center">
                <button onclick="importManager.closeModal()" 
                        class="import-btn import-btn-primary">
                    <i class="fas fa-check"></i>
                    <span>Terminer</span>
                </button>
            </div>
        `;
        
        html += '</div>';
        resultsDiv.innerHTML = html;
        
        // Cacher les autres steps et montrer le résultat
        document.getElementById('step1')?.classList.add('hidden');
        document.getElementById('step3')?.classList.remove('hidden');
    }

    /**
     * Afficher/Cacher le loading
     */
    showLoading(show, type = 'preview') {
        const previewBtn = document.getElementById('previewFileBtn');
        const executeBtn = document.getElementById('executeImportBtn');
        
        if (type === 'preview' && previewBtn) {
            if (show) {
                previewBtn.innerHTML = `
                    <span class="import-spinner"></span>
                    <span>Analyse en cours...</span>
                `;
                previewBtn.disabled = true;
            } else {
                previewBtn.innerHTML = `
                    <i class="fas fa-eye"></i>
                    <span>Prévisualiser les Données</span>
                `;
                previewBtn.disabled = false;
            }
        }
        
        if (type === 'import' && executeBtn) {
            if (show) {
                executeBtn.innerHTML = `
                    <span class="import-spinner"></span>
                    <span>Import en cours...</span>
                `;
                executeBtn.disabled = true;
            } else {
                executeBtn.innerHTML = `
                    <i class="fas fa-upload"></i>
                    <span>Importer les Données</span>
                `;
                executeBtn.disabled = false;
            }
        }
    }
}

// Instance globale
let importManager;

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    importManager = new ImportManager();
    console.log('✅ ImportManager ready');
});

