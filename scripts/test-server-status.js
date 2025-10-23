const http = require('http');

console.log('\n🔍 Vérification du serveur...\n');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    console.log(`✅ Serveur actif !`);
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   URL: http://localhost:3000`);
    console.log('\n🎯 Prêt à tester !');
    console.log('   → http://localhost:3000/login');
    console.log('   → http://localhost:3000/collect\n');
});

req.on('error', (error) => {
    console.log('❌ Serveur non accessible');
    console.log(`   Erreur: ${error.message}`);
    console.log('\n💡 Attendez quelques secondes que le serveur démarre...\n');
});

req.on('timeout', () => {
    console.log('⏱️  Timeout - Le serveur met du temps à répondre');
    console.log('   Réessayez dans quelques secondes...\n');
    req.destroy();
});

req.end();

