import * as admin from 'firebase-admin';

// Check if required environment variables are present
const requiredEnvVars = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

let initError: Error | null = null;

if (missingVars.length > 0) {
  const error = `Missing Firebase Admin environment variables: ${missingVars.join(', ')}`;
  console.error('❌', error);
  console.error('Available env vars:', {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length,
  });
  initError = new Error(error);
}

// Initialize Firebase Admin SDK
if (!admin.apps.length && !initError) {
  try {
    // Replace both literal \n strings and ensure proper newlines
    const privateKey = requiredEnvVars.privateKey!.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: requiredEnvVars.projectId!,
        clientEmail: requiredEnvVars.clientEmail!,
        privateKey: privateKey,
      }),
      databaseURL: `https://${requiredEnvVars.projectId}.firebaseio.com`,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase Admin initialized successfully');
    console.log('Project ID:', requiredEnvVars.projectId);
    console.log('Client Email:', requiredEnvVars.clientEmail);
    console.log('Private Key Length:', privateKey.length);
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    initError = error as Error;
  }
}

// Helper to check initialization before use
function checkInit() {
  if (initError) {
    throw initError;
  }
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }
}

// Export wrappers that check initialization
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(target, prop) {
    checkInit();
    return (admin.firestore() as any)[prop];
  },
});

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(target, prop) {
    checkInit();
    return (admin.auth() as any)[prop];
  },
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(target, prop) {
    checkInit();
    return (admin.storage() as any)[prop];
  },
});

export default admin;
