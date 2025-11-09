/**
 * Script to fix client account that was accidentally converted to team_member
 * Usage: npx tsx scripts/fix-client-role.ts <email>
 */

// Initialize Firebase Admin using service account JSON file
import * as admin from 'firebase-admin';
import serviceAccount from '../bluepeak-23105-firebase-adminsdk-fbsvc-b15ea453b4.json';

// Initialize Firebase Admin directly in this script
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  console.log('✅ Firebase Admin initialized\n');
}

const adminDb = admin.firestore();

async function fixClientRole(email: string) {
  try {
    console.log(`Looking for user with email: ${email}`);

    // Find user by email in users collection
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    console.log(`\nFound user:`);
    console.log(`  ID: ${userDoc.id}`);
    console.log(`  Email: ${userData.email}`);
    console.log(`  Display Name: ${userData.displayName}`);
    console.log(`  Current Role: ${userData.role}`);
    console.log(`  Client ID: ${userData.clientId || 'N/A'}`);

    if (userData.role === 'client') {
      console.log(`\n✅ User already has role 'client'. No changes needed.`);
      process.exit(0);
    }

    // Update role to 'client'
    await adminDb.collection('users').doc(userDoc.id).update({
      role: 'client',
      updatedAt: new Date(),
    });

    console.log(`\n✅ Successfully updated role from '${userData.role}' to 'client'`);
    console.log(`\nUser can now log in via /client-portal/login`);
  } catch (error) {
    console.error('❌ Error fixing client role:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/fix-client-role.ts <email>');
  console.error('Example: npx tsx scripts/fix-client-role.ts blakemarcotte@bpnsolutions.com');
  process.exit(1);
}

fixClientRole(email);
