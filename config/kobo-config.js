// Configuration KoboCollect pour la synchronisation
module.exports = {
    // URL de l'API KoboCollect (API REST v2)
    apiUrl: process.env.KOBO_API_URL || 'https://kf.kobotoolbox.org/api/v2',
    
    // Token API KoboCollect (depuis .env uniquement)
    apiToken: process.env.KOBO_API_TOKEN,
    
    // IDs des formulaires KoboCollect (depuis .env uniquement)
    forms: {
        gites: process.env.KOBO_FORM_GITES_ID,
        oeufs: process.env.KOBO_FORM_OEUFS_ID,
        adultes: process.env.KOBO_FORM_ADULTES_ID
    }
};






