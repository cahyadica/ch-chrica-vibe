import admin from 'firebase-admin';
import fs from 'fs';

// --- CONFIGURATION ---
const SERVICE_ACCOUNT_KEY_FILE = './service-account.json';
const BUCKET_NAME = 'gen-lang-client-0583407156.firebasestorage.app';

async function setCors() {
  if (!fs.existsSync(SERVICE_ACCOUNT_KEY_FILE)) {
    console.error('ERROR: service-account.json not found!');
    console.log('Please download your Service Account Key from Firebase Console:');
    console.log('1. Project Settings > Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save it as "service-account.json" in this project root.');
    return;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_FILE, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: BUCKET_NAME
  });

  const bucket = admin.storage().bucket();

  const corsConfiguration = [
    {
      origin: ['*'],
      method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      responseHeader: ['Content-Type', 'Authorization', 'x-goog-resumable'],
      maxAgeSeconds: 3600,
    },
  ];

  try {
    console.log(`Applying CORS policy to bucket: ${BUCKET_NAME}...`);
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log('SUCCESS: CORS policy applied successfully!');
  } catch (error) {
    console.error('FAILED to set CORS policy:', error);
  }
}

setCors();
