import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const CLIENTS_COLLECTION = 'clients';

export async function POST(request: NextRequest) {
  try {
    const { email, password, linkId } = await request.json();

    if (!email || !password || !linkId) {
      return NextResponse.json(
        { error: 'Email, password, and linkId are required' },
        { status: 400 }
      );
    }

    // First, find the client by linkId
    const snapshot = await adminDb
      .collection(CLIENTS_COLLECTION)
      .where('discoveryLinkId', '==', linkId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid discovery link' },
        { status: 404 }
      );
    }

    const clientDoc = snapshot.docs[0];
    const clientData = clientDoc.data();

    // Check if client email matches
    if (clientData.email !== email) {
      return NextResponse.json(
        { error: 'Email does not match client record' },
        { status: 400 }
      );
    }

    // Check if account already exists
    if (clientData.hasAccount) {
      return NextResponse.json(
        { error: 'Account already exists for this client' },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: clientData.name,
    });

    const now = new Date();

    // Create User record in database with role='client'
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      displayName: clientData.name,
      role: 'client',
      clientId: clientDoc.id, // Link to Client record
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });

    // Update client record with auth info
    await adminDb.collection(CLIENTS_COLLECTION).doc(clientDoc.id).update({
      hasAccount: true,
      firebaseAuthUid: userRecord.uid,
      accountCreatedAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
