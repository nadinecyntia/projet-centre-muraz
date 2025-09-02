// Configuration KoboCollect pour la synchronisation
module.exports = {
    // URL de l'API KoboCollect (API REST v2)
    apiUrl: process.env.KOBO_API_URL || 'https://kf.kobotoolbox.org/api/v2',
    
    // Token API KoboCollect (depuis .env)
    apiToken: process.env.KOBO_API_TOKEN || 'cc56673ccdce38c375bf491b06f6132ee289606e',
    
    // IDs des formulaires KoboCollect (depuis .env)
    forms: {
        gites: process.env.KOBO_FORM_GITES_ID || 'auDtEVrCioE3PnjQ9VpC4C',
        oeufs: process.env.KOBO_FORM_OEUFS_ID || 'a2Y4srJkaBu4F8W4Qf5577',
        adultes: process.env.KOBO_FORM_ADULTES_ID || 'aN4GByzPSxLW28Zc8cPMKP'
    }
};






