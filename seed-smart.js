const { pool } = require('./config/database');

function pick(values, fallback) {
	if (Array.isArray(values) && values.length > 0) return values[0];
	return fallback;
}

function toISO(year, month, day) {
	const d = new Date(year, month - 1, day);
	return d.toISOString().slice(0, 10);
}

async function getDistinct(query) {
	const { rows } = await pool.query(query);
	return rows.map(r => Object.values(r)[0]).filter(Boolean);
}

async function main() {
	console.log('🌱 Seed intelligent démarré...');
	const client = await pool.connect();
	try {
		// Collecter des valeurs existantes conformes
		const eggsSectors = await getDistinct("SELECT DISTINCT eggs_sector FROM eggs_collection_new WHERE eggs_sector IS NOT NULL");
		const eggsEnvs = await getDistinct("SELECT DISTINCT eggs_environment FROM eggs_collection_new WHERE eggs_environment IS NOT NULL");
		const siteSectors = await getDistinct("SELECT DISTINCT site_sector FROM breeding_sites_new WHERE site_sector IS NOT NULL");
		const siteEnvs = await getDistinct("SELECT DISTINCT site_environment FROM breeding_sites_new WHERE site_environment IS NOT NULL");
		const mosSectors = await getDistinct("SELECT DISTINCT mosquitoes_sector FROM adult_mosquitoes_new WHERE mosquitoes_sector IS NOT NULL");
		const mosEnvs = await getDistinct("SELECT DISTINCT mosquitoes_environment FROM adult_mosquitoes_new WHERE mosquitoes_environment IS NOT NULL");
		const mosCaptLoc = await getDistinct("SELECT DISTINCT capture_locations FROM adult_mosquitoes_new WHERE capture_locations IS NOT NULL");
		const mosMethods = await getDistinct("SELECT DISTINCT collection_methods FROM adult_mosquitoes_new WHERE collection_methods IS NOT NULL");

		// Choix compatibles
		const sectors = [
			(eggsSectors.find(s => /6/.test(s)) || siteSectors.find(s => /6/.test(s)) || mosSectors.find(s => /6/.test(s)) || eggsSectors[0] || siteSectors[0] || mosSectors[0] || 'secteur_6'),
			(eggsSectors.find(s => /9/.test(s)) || siteSectors.find(s => /9/.test(s)) || mosSectors.find(s => /9/.test(s)) || eggsSectors[1] || siteSectors[1] || mosSectors[1]),
			(eggsSectors.find(s => /22/.test(s)) || siteSectors.find(s => /22/.test(s)) || mosSectors.find(s => /22/.test(s)) || eggsSectors[2] || siteSectors[2] || mosSectors[2])
		].filter(Boolean);
		if (sectors.length === 0) sectors.push('secteur_6');

		const envs = [
			(eggsEnvs[0] || siteEnvs[0] || mosEnvs[0] || 'urbain'),
			(eggsEnvs.find(e => /rural/i.test(e)) || siteEnvs.find(e => /rural/i.test(e)) || mosEnvs.find(e => /rural/i.test(e)) || eggsEnvs[1] || siteEnvs[1] || mosEnvs[1])
		].filter(Boolean);
		const captLocAllowed = pick(mosCaptLoc, 'interior');
		const methodsAllowed = pick(mosMethods, 'bg');

		const year = new Date().getFullYear();

		await client.query('BEGIN');

		// Boucle sur les mois 1..12 (dates au 10 du mois)
		for (let m = 1; m <= 12; m++) {
			const day = Math.min(10 + (m % 10), 27);
			const dateStr = toISO(year, m, day);
			const sector = sectors[(m - 1) % sectors.length];
			const env = envs[(m - 1) % envs.length] || envs[0] || 'urbain';

			// ŒUFS
			const eggsCount = 60 + m * 7; // variation
			await client.query(
				`INSERT INTO eggs_collection_new (
					eggs_concession_code, eggs_sector, eggs_environment, eggs_visit_start_date, eggs_gps_code,
					nest_number, nest_code, pass_order, eggs_count, observations, status, created_at, validated_at
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'approved', NOW(), NOW())`,
				[
					`EC-${year}-${String(m).padStart(2, '0')}`, sector, env, dateStr, `EG-${m}`,
					'PN-01', 'N-01', 'P1', eggsCount, 'seed-month'
				]
			);

			// GÎTES
			const totalSites = 6 + (m % 5);
			const posSites = 1 + (m % 3);
			const larvae = 15 + m * 3;
			const nymphs = 2 + (m % 6);
			await client.query(
				`INSERT INTO breeding_sites_new (
					site_investigator_name, site_concession_code, site_house_code, site_sector, site_environment,
					site_visit_start_date, site_gps_code, site_household_size, site_sleeping_unit_count,
					total_sites_count, positive_sites_count, negative_sites_count,
					larvae_genus, larvae_count, aedes_larvae_count, culex_larvae_count, anopheles_larvae_count, other_larvae_count,
					nymphs_genus, nymphs_count, aedes_nymphs_count, culex_nymphs_count, anopheles_nymphs_count, other_nymphs_count,
					sites_types, site_classes, observations, status, created_at, validated_at
				) VALUES (
					$1,$2,$3,$4,$5,$6,$7,
					$8,$9,
					$10,$11,$12,
					$13,$14,$15,$16,$17,$18,
					$19,$20,$21,$22,$23,$24,
					$25,$26,$27,'approved', NOW(), NOW()
				)`,
				[
					`INV-${year}`, `BS-${year}-${String(m).padStart(2, '0')}`, `H-${m}`, sector, env,
					dateStr, `BS-${m}`, 5, 2,
					totalSites, posSites, Math.max(0, totalSites - posSites),
					['aedes'], larvae, Math.round(larvae * 0.6), Math.round(larvae * 0.3), Math.round(larvae * 0.1), 0,
					['aedes'], nymphs, Math.round(nymphs * 0.6), Math.round(nymphs * 0.3), Math.round(nymphs * 0.1), 0,
					['pneu'], ['classe_A'], 'seed-month'
				]
			);

			// MOUSTIQUES
			const bgCount = 8 + (m * 2);
			const pkCount = 5 + m;
			const total = bgCount + pkCount;
			const males = Math.round(total * 0.4);
			const females = total - males;
			await client.query(
				`INSERT INTO adult_mosquitoes_new (
					mosquitoes_concession_code, mosquitoes_sector, mosquitoes_environment, mosquitoes_visit_start_date, mosquitoes_gps_code,
					genus, species, collection_methods, prokopack_traps_count, bg_traps_count, capture_locations,
					prokopack_mosquitoes_count, bg_trap_mosquitoes_count, total_mosquitoes_count,
					male_count, aedes_male_count, culex_male_count, anopheles_male_count, other_male_count,
					female_count, blood_fed_females_count, gravid_females_count, starved_females_count,
					mosquitoes_aedes_count, mosquitoes_culex_count, mosquitoes_anopheles_count, mosquitoes_other_count,
					observations, status, created_at, validated_at
				) VALUES (
					$1,$2,$3,$4,$5,
					$6,$7,$8,$9,$10,$11,
					$12,$13,$14,
					$15,$16,$17,$18,$19,
					$20,$21,$22,$23,
					$24,$25,$26,$27,
					$28,'approved', NOW(), NOW()
				)`,
				[
					`AM-${year}-${String(m).padStart(2, '0')}`, sector, env, dateStr, `AM-${m}`,
					['aedes'], ['aedes_aegypti'], methodsAllowed, 1, 1, captLocAllowed,
					pkCount, bgCount, total,
					males, Math.round(males * 0.6), Math.round(males * 0.3), Math.round(males * 0.1), 0,
					females, Math.round(females * 0.3), Math.round(females * 0.2), Math.round(females * 0.5),
					Math.round(total * 0.6), Math.round(total * 0.3), Math.round(total * 0.1), 0,
					'seed-month'
				]
			);
		}

		await client.query('COMMIT');
		console.log('✅ Seed mensuel terminé.');
	} catch (e) {
		await client.query('ROLLBACK');
		console.error('❌ Seed échoué:', e.message);
		process.exitCode = 1;
	} finally {
		client.release();
		await pool.end();
	}
}

main();
