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
    // Handle multiple possible formats of the private key
    let privateKey = requiredEnvVars.privateKey!;

    // If the key is in JSON string format (enclosed in quotes), parse it
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      try {
        privateKey = JSON.parse(privateKey);
      } catch (e) {
        console.warn('Failed to parse private key as JSON string, using as-is');
      }
    }

    // Replace escaped newlines with actual newlines
    // This handles both \\n (double backslash) and \n (single backslash)
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Additional safety check: ensure the key has proper PEM format with newlines
    if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ Private key appears to be missing newlines');
      console.error('Key preview:', privateKey.substring(0, 100));
      throw new Error('FIREBASE_PRIVATE_KEY must contain proper line breaks. Please ensure \\n characters are preserved in Vercel environment variable.');
    }

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
    console.log('Private Key has newlines:', privateKey.includes('\n'));
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
