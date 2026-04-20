const admin = require('firebase-admin');
require('dotenv').config();

// Get private key and ensure it has proper line breaks
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
}

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey
};

// Initialize only if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('✅ Firebase Admin initialized successfully');
    } catch (err) {
        console.error('❌ Firebase initialization error:', err.message);
        // Don't throw - let the app continue without Firebase for testing
    }
}

module.exports = { admin };
