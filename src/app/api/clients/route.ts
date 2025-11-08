import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth, adminStorage } from '@/lib/firebaseAdmin';
import { Client } from '@/types';

const CLIENTS_COLLECTION = 'clients';

// GET - Fetch all clients or filter by userId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = adminDb.collection(CLIENTS_COLLECTION);

    if (userId) {
      query = query.where('userId', '==', userId) as any;
    }

    const snapshot = await query.get();

    const clients: Client[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();

      // Helper function to convert various date formats to Date objects
      const convertToDate = (dateValue: any): Date | undefined => {
        if (!dateValue) return undefined;
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
          return dateValue.toDate(); // Firestore Timestamp
        }
        if (dateValue instanceof Date) {
          return dateValue;
        }
        if (typeof dateValue === 'string' || typeof dateValue === 'number') {
          return new Date(dateValue);
        }
        return undefined;
      };

      clients.push({
        id: doc.id,
        ...data,
        createdAt: convertToDate(data.createdAt) || new Date(),
        updatedAt: convertToDate(data.updatedAt) || new Date(),
        meetingDate: convertToDate(data.meetingDate),
        accountCreatedAt: convertToDate(data.accountCreatedAt),
      } as Client);
    });

    // Sort by most recent first
    clients.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newClient: Omit<Client, 'id'> = {
      name: body.name,
      email: body.email,
      company: body.company,
      industry: body.industry,
      phone: body.phone,
      onboardingStage: body.onboardingStage || 'created',
      discoveryLinkId: body.discoveryLinkId || Math.random().toString(36).substring(7),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: body.userId || 'demo-user', // In production, get from auth
      hasAccount: false, // Client hasn't created portal account yet
    };

    const docRef = await adminDb.collection(CLIENTS_COLLECTION).add({
      ...newClient,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const client: Client = {
      id: docRef.id,
      ...newClient,
    };

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing client
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection(CLIENTS_COLLECTION)
      .doc(id)
      .update({
        ...updates,
        updatedAt: new Date(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a client and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Get client data first to access related resources
    const clientDoc = await adminDb.collection(CLIENTS_COLLECTION).doc(id).get();

    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const clientData = clientDoc.data();

    // Delete Firebase Auth user and user document if client created a portal account
    if (clientData?.firebaseAuthUid) {
      try {
        // Delete from Firebase Auth
        await adminAuth.deleteUser(clientData.firebaseAuthUid);
        console.log('✅ Deleted Firebase Auth user:', clientData.firebaseAuthUid);
      } catch (authError: any) {
        // Continue even if auth deletion fails (user might already be deleted)
        console.warn('⚠️ Failed to delete Firebase Auth user:', authError.message);
      }

      try {
        // Delete from users collection
        await adminDb.collection('users').doc(clientData.firebaseAuthUid).delete();
        console.log('✅ Deleted user document:', clientData.firebaseAuthUid);
      } catch (userDocError: any) {
        // Continue even if user doc deletion fails (doc might already be deleted)
        console.warn('⚠️ Failed to delete user document:', userDocError.message);
      }
    }

    // Delete logo from Firebase Storage if it exists
    if (clientData?.logoUrl) {
      try {
        const bucket = adminStorage.bucket();

        // Extract filename from URL
        // URL format: https://storage.googleapis.com/{bucket}/logos/{filename}
        const urlParts = clientData.logoUrl.split('/');
        const filename = urlParts.slice(-2).join('/'); // Gets "logos/{filename}"

        const fileRef = bucket.file(filename);
        await fileRef.delete();
        console.log('✅ Deleted logo from storage:', filename);
      } catch (storageError: any) {
        // Continue even if storage deletion fails (file might already be deleted)
        console.warn('⚠️ Failed to delete logo from storage:', storageError.message);
      }
    }

    // Delete the client document
    await adminDb.collection(CLIENTS_COLLECTION).doc(id).delete();
    console.log('✅ Deleted client document:', id);

    return NextResponse.json({
      success: true,
      deletedAuth: !!clientData?.firebaseAuthUid,
      deletedUserDoc: !!clientData?.firebaseAuthUid,
      deletedLogo: !!clientData?.logoUrl,
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
