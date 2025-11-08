import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const USERS_COLLECTION = 'users';
const CLIENTS_COLLECTION = 'clients';

// Migration script to create User records for all existing Firebase Auth users
export async function POST(request: NextRequest) {
  try {
    console.log('Starting user migration...');

    // Fetch all Firebase Auth users
    const listUsersResult = await adminAuth.listUsers();
    const authUsers = listUsersResult.users;

    console.log(`Found ${authUsers.length} Firebase Auth users`);

    const results = {
      migrated: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
    };

    // Process each Firebase Auth user
    for (const authUser of authUsers) {
      try {
        const uid = authUser.uid;
        const email = authUser.email || '';
        const displayName = authUser.displayName || email.split('@')[0];

        // Check if User record already exists
        const existingUser = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
        if (existingUser.exists) {
          console.log(`User ${email} already has a User record, skipping`);
          results.skipped++;
          results.details.push({ email, status: 'skipped', reason: 'User record already exists' });
          continue;
        }

        // Check if this user is a client by searching for Client record
        const clientSnapshot = await adminDb
          .collection(CLIENTS_COLLECTION)
          .where('firebaseAuthUid', '==', uid)
          .limit(1)
          .get();

        const isClient = !clientSnapshot.empty;
        const clientId = isClient ? clientSnapshot.docs[0].id : undefined;

        const now = new Date();
        const userData = {
          email,
          displayName,
          role: isClient ? 'client' : 'team_member',
          clientId: clientId || null,
          createdAt: authUser.metadata.creationTime
            ? new Date(authUser.metadata.creationTime)
            : now,
          updatedAt: now,
          lastLoginAt: authUser.metadata.lastSignInTime
            ? new Date(authUser.metadata.lastSignInTime)
            : null,
        };

        // Create User record
        await adminDb.collection(USERS_COLLECTION).doc(uid).set(userData);

        console.log(`Created User record for ${email} (role: ${userData.role})`);
        results.migrated++;
        results.details.push({
          email,
          role: userData.role,
          status: 'migrated',
          clientId: clientId || null,
        });
      } catch (error) {
        console.error(`Error processing user ${authUser.email}:`, error);
        results.errors++;
        results.details.push({
          email: authUser.email,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('Migration complete:', results);

    return NextResponse.json({
      success: true,
      message: 'User migration completed',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
