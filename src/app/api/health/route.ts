import { NextResponse } from 'next/server';

/**
 * Health check endpoint to diagnose Firebase Admin issues
 * GET /api/health
 */
export async function GET() {
  try {
    const health: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVars: {
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID_VALUE: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'missing',
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_CLIENT_EMAIL_VALUE: process.env.FIREBASE_CLIENT_EMAIL || 'missing',
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        FIREBASE_PRIVATE_KEY_PREVIEW: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50) || 'missing',
      },
      status: 'ok',
    };

    // Try to import and use Firebase Admin
    try {
      const { adminDb } = await import('@/lib/firebaseAdmin');
      health.firebaseAdmin = {
        imported: true,
        firestoreAccessible: false,
      };

      // Try to access Firestore
      try {
        const testDoc = await adminDb.collection('_health_check').doc('test').get();
        health.firebaseAdmin.firestoreAccessible = true;
        health.firebaseAdmin.testDocExists = testDoc.exists;
      } catch (firestoreError) {
        health.firebaseAdmin.firestoreError = firestoreError instanceof Error ? firestoreError.message : 'Unknown error';
      }
    } catch (importError) {
      health.firebaseAdmin = {
        imported: false,
        importError: importError instanceof Error ? importError.message : 'Unknown error',
        importStack: importError instanceof Error ? importError.stack : undefined,
      };
    }

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
