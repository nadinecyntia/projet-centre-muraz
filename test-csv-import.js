const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCSVImport() {
    try {
        // 1. Se connecter d'abord
        console.log('🔐 Connexion...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        const loginResult = await loginResponse.json();
        if (!loginResult.success) {
            throw new Error('Échec de la connexion: ' + loginResult.message);
        }

        // 2. Extraire le cookie de session
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Connexion réussie');

        // 3. Tester l'import CSV
        console.log('📥 Test import CSV...');
        const form = new FormData();
        form.append('csvFile', fs.createReadStream('test-mosquitoes-simple.csv'));
        form.append('dataType', 'mosquitoes');

        const importResponse = await fetch('http://localhost:3000/api/csv/import', {
            method: 'POST',
            body: form,
            headers: {
                'Cookie': cookies
            }
        });

        const result = await importResponse.text();
        console.log('Status:', importResponse.status);
        console.log('Response:', result);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCSVImport();
