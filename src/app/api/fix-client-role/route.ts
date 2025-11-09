import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * API endpoint to fix a client account that was accidentally converted to team_member
 * GET /api/fix-client-role?email=<email>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Looking for user with email: ${email}`);

    // Find user by email in users collection
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: `No user found with email: ${email}` },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    const userInfo = {
      id: userDoc.id,
      email: userData.email,
      displayName: userData.displayName,
      currentRole: userData.role,
      clientId: userData.clientId || null,
    };

    console.log('Found user:', userInfo);

    if (userData.role === 'client') {
      return NextResponse.json({
        message: 'User already has role "client". No changes needed.',
        user: userInfo,
      });
    }

    // Update role to 'client'
    await adminDb.collection('users').doc(userDoc.id).update({
      role: 'client',
      updatedAt: new Date(),
    });

    console.log(`✅ Successfully updated role from '${userData.role}' to 'client'`);

    return NextResponse.json({
      success: true,
      message: `Successfully updated role from '${userData.role}' to 'client'`,
      user: {
        ...userInfo,
        newRole: 'client',
      },
    });
  } catch (error) {
    console.error('Error fixing client role:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix client role',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
