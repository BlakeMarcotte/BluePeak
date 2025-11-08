import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Client } from '@/types';

const CLIENTS_COLLECTION = 'clients';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const byLinkId = searchParams.get('byLinkId') === 'true';

    let client: Client | null = null;

    if (byLinkId) {
      // Search by discoveryLinkId
      const snapshot = await adminDb
        .collection(CLIENTS_COLLECTION)
        .where('discoveryLinkId', '==', id)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        client = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          meetingDate: data.meetingDate?.toDate(),
        } as Client;
      }
    } else {
      // Search by document ID
      const doc = await adminDb.collection(CLIENTS_COLLECTION).doc(id).get();

      if (doc.exists) {
        const data = doc.data();
        if (data) {
          client = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            meetingDate: data.meetingDate?.toDate(),
          } as Client;
        }
      }
    }

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}
