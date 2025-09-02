const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const updateUserRoles = async () => {
    try {
        console.log('🔄 Mise à jour des rôles utilisateurs...');

        // Mettre à jour l'utilisateur admin existant
        await pool.query(`
            UPDATE users 
            SET role = 'SUPER_ADMIN' 
            WHERE username = 'admin'
        `);
        console.log('✅ Utilisateur admin mis à jour avec le rôle SUPER_ADMIN');

        // Créer un utilisateur viewer de test
        const viewerPassword = await bcrypt.hash('viewer123', 10);
        await pool.query(`
            INSERT INTO users (username, email, password_hash, role) 
            VALUES ('viewer', 'viewer@centre-muraz.bf', $1, 'VIEWER')
            ON CONFLICT (username) DO UPDATE SET 
                role = 'VIEWER',
                password_hash = $1
        `, [viewerPassword]);
        console.log('✅ Utilisateur viewer créé/mis à jour (username: viewer, password: viewer123)');

        // Vérifier les utilisateurs
        const users = await pool.query('SELECT username, email, role FROM users');
        console.log('📊 Utilisateurs dans la base:');
        users.rows.forEach(user => {
            console.log(`  - ${user.username} (${user.email}) : ${user.role}`);
        });

        console.log('✅ Mise à jour des rôles terminée !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des rôles:', error);
        throw error;
    } finally {
        await pool.end();
    }
};

// Exécuter le script
updateUserRoles();
