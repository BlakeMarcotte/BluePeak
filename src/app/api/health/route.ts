import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

/**
 * Health check endpoint to diagnose Firebase Admin issues
 * GET /api/health
 */
export async function GET() {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVars: {
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      },
      firebase: {
        appsInitialized: admin.apps.length,
        appName: admin.apps[0]?.name || 'none',
      },
      status: 'ok',
    };

    // Try to access Firestore to verify it works
    try {
      const db = admin.firestore();
      const testDoc = await db.collection('_health_check').doc('test').get();
      health.firebase = {
        ...health.firebase,
        firestoreAccessible: true,
      };
    } catch (firestoreError) {
      health.firebase = {
        ...health.firebase,
        firestoreAccessible: false,
        firestoreError: firestoreError instanceof Error ? firestoreError.message : 'Unknown error',
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
