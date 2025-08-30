let kpis = { gites: 0, oeufs: 0, adultes: 0, ibMoyen: 0 };
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
	try {
		const [analyses, indices] = await Promise.all([
			fetchJson('/api/analyses'),
			fetchJson('/api/indices')
		]);

		updateKpis(analyses, indices);
		renderCharts(analyses, indices);
		populateAlerts(analyses, indices);
	} catch (e) {
		console.error('Dashboard error:', e);
	}
});

async function fetchJson(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	const json = await res.json();
	if (!json.success) throw new Error(json.message || 'Unknown error');
	return json.data;
}

function updateKpis(analyses, indices) {
	kpis.gites = analyses.totalLarves || (analyses.gites?.length || 0);
	kpis.oeufs = analyses.totalOeufs || (analyses.oeufs?.length || 0);
	kpis.adultes = analyses.totalAdultes || (analyses.adultes?.length || 0);

	// moyenne IB dernière période si dispo
	let ibMoy = 0;
	if (indices?.periodes?.length && indices?.secteurs?.length) {
		const last = indices.periodes[indices.periodes.length - 1];
		const vals = indices.secteurs.map(s => indices.breteau?.[last]?.[s] || 0);
		ibMoy = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
	}
	kpis.ibMoyen = ibMoy;

	setText('kpi-gites', kpis.gites);
	setText('kpi-oeufs', kpis.oeufs);
	setText('kpi-adultes', kpis.adultes);
	setText('kpi-ib', `${kpis.ibMoyen.toFixed(2)}%`);
}

function renderCharts(analyses, indices) {
	createLarvesChart(analyses);
	createIndicesSecteurChart(indices);
	createOeufsChart(analyses);
	createAdultesChart(analyses);
}

function createLarvesChart(analyses) {
	const ctx = byId('chartLarves');
	if (!ctx || !analyses?.chartData?.larves) return;
	const periodes = Object.keys(analyses.chartData.larves);
	const secteurs = analyses.secteurs || [];
	const datasets = secteurs.map(secteur => ({
		label: secteur,
		data: periodes.map(p => analyses.chartData.larves[p][secteur] || 0),
		borderColor: color(),
		backgroundColor: color(0.2)
	}));
	charts.larves = new Chart(ctx, { type:'bar', data:{ labels: periodes, datasets }, options:{ responsive:true, maintainAspectRatio:false } });
}

function createIndicesSecteurChart(indices) {
	const ctx = byId('chartIndicesSecteur');
	if (!ctx || !indices?.breteau) return;
	const last = indices.periodes?.[indices.periodes.length-1];
	const labels = indices.secteurs || [];
	const data = labels.map(s => indices.breteau?.[last]?.[s] || 0);
	charts.indicesSecteur = new Chart(ctx, { type:'radar', data:{ labels, datasets:[{ label:`IB - ${last||''}`, data, borderColor: color(), backgroundColor: color(0.2)}]}, options:{ responsive:true, maintainAspectRatio:false } });
}

function createOeufsChart(analyses) {
	const ctx = byId('chartOeufs');
	if (!ctx || !analyses?.chartData?.oeufs) return;
	const secteurs = analyses.secteurs || [];
	const totals = secteurs.map(sec => {
		let total = 0; Object.values(analyses.chartData.oeufs).forEach(periodObj => total += (periodObj[sec]||0)); return total;
	});
	charts.oeufs = new Chart(ctx, { type:'doughnut', data:{ labels: secteurs, datasets:[{ data: totals, backgroundColor: secteurs.map(()=>color(0.8)) }]}, options:{ responsive:true, maintainAspectRatio:false } });
}

function createAdultesChart(analyses) {
	const ctx = byId('chartAdultes');
	if (!ctx || !analyses?.chartData?.adultes) return;
	const periodes = Object.keys(analyses.chartData.adultes);
	const totals = periodes.map(p => { let t=0; Object.values(analyses.chartData.adultes[p]).forEach(v=> t+= (v||0)); return t; });
	charts.adultes = new Chart(ctx, { type:'line', data:{ labels: periodes, datasets:[{ label:'Adultes', data: totals, borderColor: color(), backgroundColor: color(0.2), tension:0.2 }]}, options:{ responsive:true, maintainAspectRatio:false } });
}

function populateAlerts(analyses, indices) {
	const list = byId('alerts');
	if (!list) return;
	list.innerHTML = '';
	// Exemple d'alertes simples
	if (kpis.ibMoyen > 20) addAlert('Indice Breteau élevé sur la dernière période', 'warning');
	if ((analyses?.adultes?.length||0) > 0) addAlert('Présence de moustiques adultes détectée', 'info');
	addAlert('Synchronisation et agrégation des données réussies', 'success');
}

function addAlert(text, type='info') {
	const colors = { info:'bg-blue-50 border-blue-200 text-blue-700', warning:'bg-yellow-50 border-yellow-200 text-yellow-700', success:'bg-green-50 border-green-200 text-green-700' };
	const li = document.createElement('li');
	li.className = `p-4 border rounded ${colors[type]||colors.info}`;
	li.textContent = text;
	byId('alerts').appendChild(li);
}

function setText(id, value) { const el = byId(id); if (el) el.textContent = value; }
function byId(id) { return document.getElementById(id); }
function color(alpha=1){ const r = rand(); const g = rand(); const b = rand(); return `rgba(${r},${g},${b},${alpha})`; }
function rand(){ return Math.floor(80 + Math.random()*160); }






