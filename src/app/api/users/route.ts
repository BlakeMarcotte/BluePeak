import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { User, UserRole } from '@/types';

const USERS_COLLECTION = 'users';

// GET /api/users - Fetch all users or single user by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const role = searchParams.get('role') as UserRole | null;

    // Fetch single user by ID
    if (uid) {
      const doc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const data = doc.data();
      const user: User = {
        id: doc.id,
        email: data?.email || '',
        displayName: data?.displayName || '',
        role: data?.role || 'team_member',
        clientId: data?.clientId,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
        lastLoginAt: data?.lastLoginAt?.toDate(),
      };

      return NextResponse.json({ user });
    }

    // Fetch all users or filter by role
    let query = adminDb.collection(USERS_COLLECTION);

    if (role) {
      query = query.where('role', '==', role) as any;
    }

    const snapshot = await query.get();
    const users: User[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        role: data.role || 'team_member',
        clientId: data.clientId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate(),
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, displayName, role, clientId } = body;

    if (!id || !email || !displayName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email, displayName, role' },
        { status: 400 }
      );
    }

    const now = new Date();
    const userData = {
      email,
      displayName,
      role,
      clientId: clientId || null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    await adminDb.collection(USERS_COLLECTION).doc(id).set(userData);

    const user: User = {
      id,
      ...userData,
    };

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, displayName, role, lastLoginAt } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (role !== undefined) updateData.role = role;
    if (lastLoginAt !== undefined) updateData.lastLoginAt = new Date(lastLoginAt);

    await adminDb.collection(USERS_COLLECTION).doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await adminDb.collection(USERS_COLLECTION).doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
