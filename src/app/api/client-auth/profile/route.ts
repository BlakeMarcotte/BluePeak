import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Client } from '@/types';

const CLIENTS_COLLECTION = 'clients';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'Firebase Auth UID is required' },
        { status: 400 }
      );
    }

    // Find client by firebaseAuthUid
    const snapshot = await adminDb
      .collection(CLIENTS_COLLECTION)
      .where('firebaseAuthUid', '==', uid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Client profile not found' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const client: Client = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      meetingDate: data.meetingDate?.toDate(),
      accountCreatedAt: data.accountCreatedAt?.toDate(),
    } as Client;

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error fetching client profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client profile' },
      { status: 500 }
    );
  }
}
