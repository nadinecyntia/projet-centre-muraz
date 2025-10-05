const FormData = require('form-data');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testUpload() {
    try {
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

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Connexion réussie');

        // Test de prévisualisation d'abord
        console.log('📊 Test prévisualisation CSV...');
        const form = new FormData();
        form.append('csvFile', fs.createReadStream('test-mosquitoes-simple.csv'));
        form.append('dataType', 'mosquitoes');

        const previewResponse = await fetch('http://localhost:3000/api/csv/preview', {
            method: 'POST',
            body: form,
            headers: {
                'Cookie': cookies
            }
        });

        const previewResult = await previewResponse.text();
        console.log('Status:', previewResponse.status);
        console.log('Response:', previewResult);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testUpload();
