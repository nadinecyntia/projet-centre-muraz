// ===================================================================
// SCRIPT DE COLLECTE - VERSION SIMPLIFIÉE
// Centre MURAZ - Plateforme de Surveillance Arboviroses
// ===================================================================

(function() {
	'use strict';
	
	// ===============================================
	// GESTION DES ONGLETS
	// ===============================================
	
	const tabs = document.querySelectorAll('.tab');
	const sections = document.querySelectorAll('.section');
	
	tabs.forEach(tab => {
		tab.addEventListener('click', () => {
			tabs.forEach(t => t.classList.remove('active'));
			sections.forEach(s => s.style.display = 'none');
			tab.classList.add('active');
			const targetId = tab.getAttribute('data-target');
			document.querySelector(targetId).style.display = 'block';
		});
	});
	
	// ===============================================
	// GÉOLOCALISATION GPS
	// ===============================================
	
	function initializeGPSButtons() {
		document.querySelectorAll('[data-gps]').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.preventDefault(); // Empêcher toute soumission de formulaire
				e.stopPropagation();
				
				const fieldName = btn.getAttribute('data-gps');
				
				// Chercher le champ : d'abord dans le parent direct, puis dans la section
				let field = null;
				const parent = btn.parentElement;
				
				// Chercher dans le parent direct (div.actions)
				if (parent) {
					field = parent.querySelector(`input[name="${fieldName}"]`);
				}
				
				// Si pas trouvé, chercher dans toute la section parente
				if (!field) {
					const section = btn.closest('.section');
					if (section) {
						field = section.querySelector(`input[name="${fieldName}"]`);
					}
				}
				
				// Si toujours pas trouvé, chercher dans tout le document (dernier recours)
				if (!field) {
					field = document.querySelector(`input[name="${fieldName}"]`);
				}
				
				console.log('🌍 Bouton GPS cliqué, champ cible:', fieldName);
				console.log('🔍 Champ trouvé:', field ? 'OUI' : 'NON', field);
				
				if (!field) {
					alert(`Erreur: Champ "${fieldName}" introuvable ! Veuillez vérifier que le champ existe dans le formulaire.`);
					console.error('❌ Champ introuvable:', fieldName);
					console.error('📍 Parent:', parent);
					console.error('📍 Section:', btn.closest('.section'));
					return;
				}
				
				if (!navigator.geolocation) {
					alert('❌ Géolocalisation non supportée par ce navigateur');
					console.error('❌ navigator.geolocation non disponible');
					return;
				}
				
				console.log('⏳ Demande de géolocalisation en cours...');
				btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
				btn.disabled = true;
				
				navigator.geolocation.getCurrentPosition(
					pos => {
						const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
						field.value = coords;
						console.log('✅ Position obtenue:', coords);
						
						btn.innerHTML = '<i class="fas fa-check"></i>';
						setTimeout(() => {
							btn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
							btn.disabled = false;
						}, 1500);
					},
					err => {
						let errorMsg = '';
						switch(err.code) {
							case err.PERMISSION_DENIED:
								errorMsg = 'Permission refusée. Autorisez la géolocalisation dans les paramètres du navigateur.';
								break;
							case err.POSITION_UNAVAILABLE:
								errorMsg = 'Position indisponible. Vérifiez que le GPS de votre appareil est activé.';
								break;
							case err.TIMEOUT:
								errorMsg = 'Délai d\'attente dépassé. Réessayez.';
								break;
							default:
								errorMsg = 'Erreur inconnue: ' + err.message;
						}
						
						alert('❌ ' + errorMsg);
						console.error('❌ Erreur GPS:', err.code, err.message);
						
						btn.innerHTML = '<i class="fas fa-location-crosshairs"></i>';
						btn.disabled = false;
					},
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 0
					}
				);
		});
	});
	}
	
	// Initialiser les boutons GPS quand le DOM est prêt
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initializeGPSButtons);
	} else {
		initializeGPSButtons();
	}
	
	// ===============================================
	// UTILITAIRES
	// ===============================================
	
	async function postJSON(url, data) {
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		});
		
		if (!res.ok) {
			const text = await res.text();
			throw new Error(text || `Erreur HTTP ${res.status}`);
		}
		
		return res.json();
	}
	
	function showStatus(elementId, message, type = 'info') {
		const statusEl = document.getElementById(elementId);
		statusEl.textContent = message;
		statusEl.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#6b7280';
	}
	
	function resetForm(containerId) {
		const container = document.getElementById(containerId);
		container.querySelectorAll('input, select, textarea').forEach(el => {
			if (el.type === 'checkbox' || el.type === 'radio') {
				el.checked = false;
			} else if (el.tagName === 'SELECT') {
				el.selectedIndex = 0;
			} else {
				el.value = '';
			}
		});
	}
	
	// ===============================================
	// 1. COLLECTE D'ŒUFS
	// ===============================================
	
	document.getElementById('submit-eggs').addEventListener('click', async () => {
		const statusEl = 'status-eggs';
		showStatus(statusEl, 'Envoi en cours...');
		
		try {
			const section = document.getElementById('eggs');
			const formData = {};
			
			section.querySelectorAll('input, select, textarea').forEach(el => {
				if (el.name) formData[el.name] = el.value;
			});
			
			// Validation basique
			if (!formData.eggs_concession_code || !formData.eggs_sector || !formData.eggs_environment || !formData.eggs_visit_start_date) {
				throw new Error('Veuillez remplir tous les champs obligatoires');
			}
			
			const response = await postJSON('/api/collect/eggs', formData);
			
			if (response.success) {
				showStatus(statusEl, `✅ Collecte enregistrée`, 'success');
				resetForm('eggs');
			} else {
				throw new Error(response.message || 'Erreur inconnue');
			}
		} catch (error) {
			showStatus(statusEl, `❌ ${error.message}`, 'error');
			console.error('Erreur collecte œufs:', error);
		}
	});
	
	// ===============================================
	// 2. GÎTES LARVAIRES
	// ===============================================
	
	document.getElementById('submit-breeding').addEventListener('click', async () => {
		const statusEl = 'status-breeding';
		showStatus(statusEl, 'Envoi en cours...');
		
		try {
			const section = document.getElementById('breeding');
			const formData = {};
			
			section.querySelectorAll('input, select, textarea').forEach(el => {
				if (el.name) {
					// Gérer les select multiple
					if (el.multiple) {
						const selectedOptions = Array.from(el.selectedOptions).map(opt => opt.value);
						formData[el.name] = selectedOptions.length > 0 ? selectedOptions : null;
					}
					// Convertir les nombres
					else if (el.type === 'number') {
						formData[el.name] = el.value ? parseInt(el.value) || 0 : 0;
					} else {
						formData[el.name] = el.value || null;
					}
				}
			});
			
		// Validation basique
		if (!formData.concession_code || !formData.sector || !formData.environment || !formData.visit_date || !formData.investigator_name || !formData.sites_types || !formData.site_classes || !formData.site_state) {
			throw new Error('Veuillez remplir tous les champs obligatoires (concession_code, sector, environment, visit_date, investigator_name, sites_types, site_classes, site_state)');
		}
			
			const response = await postJSON('/api/collect/breeding', formData);
			
			if (response.success) {
				showStatus(statusEl, `✅ Collecte enregistrée`, 'success');
				resetForm('breeding');
			} else {
				throw new Error(response.message || 'Erreur inconnue');
			}
		} catch (error) {
			showStatus(statusEl, `❌ ${error.message}`, 'error');
			console.error('Erreur collecte gîtes:', error);
		}
	});
	
	// ===============================================
	// 3. MOUSTIQUES ADULTES
	// ===============================================
	
	document.getElementById('submit-mosquitoes').addEventListener('click', async () => {
		const statusEl = 'status-mosquitoes';
		showStatus(statusEl, 'Envoi en cours...');
		
		try {
			const section = document.getElementById('mosquitoes');
			const formData = {};
			
			section.querySelectorAll('input, select, textarea').forEach(el => {
				if (el.name) {
					// Convertir les nombres
					if (el.type === 'number') {
						formData[el.name] = el.value ? parseInt(el.value) || 0 : 0;
					} else {
						formData[el.name] = el.value || null;
					}
				}
			});
			
		// Validation basique
		if (!formData.concession_code || !formData.sector || !formData.environment || 
		    !formData.visit_date || !formData.visit_start_time || !formData.visit_end_time) {
			throw new Error('Veuillez remplir tous les champs obligatoires (concession_code, sector, environment, visit_date, visit_start_time, visit_end_time)');
		}
			
			const response = await postJSON('/api/collect/mosquitoes', formData);
			
			if (response.success) {
				showStatus(statusEl, `✅ Collecte enregistrée`, 'success');
				resetForm('mosquitoes');
			} else {
				throw new Error(response.message || 'Erreur inconnue');
			}
		} catch (error) {
			showStatus(statusEl, `❌ ${error.message}`, 'error');
			console.error('Erreur collecte moustiques:', error);
		}
	});
	
	console.log('✅ Module de collecte simplifié chargé');
})();
