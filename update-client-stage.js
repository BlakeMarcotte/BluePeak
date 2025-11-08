const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./bluepeak-23105-firebase-adminsdk-n6o2r-bfc30bc71c.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateClientStage() {
  try {
    // Find the client with company name "BPN Phil" or name containing "Phil"
    const snapshot = await db.collection('clients')
      .where('company', '==', 'BPN Phil')
      .get();

    if (snapshot.empty) {
      // Try searching by name instead
      const snapshot2 = await db.collection('clients').get();
      const philClient = snapshot2.docs.find(doc => 
        doc.data().company?.includes('Phil') || 
        doc.data().name?.includes('Phil')
      );
      
      if (!philClient) {
        console.log('Client not found');
        process.exit(1);
      }

      const clientId = philClient.id;
      const clientData = philClient.data();
      
      console.log(`Found client: ${clientData.name} - ${clientData.company}`);
      console.log(`Current stage: ${clientData.onboardingStage}`);
      
      // Update to discovery_complete stage
      await db.collection('clients').doc(clientId).update({
        onboardingStage: 'discovery_complete',
        updatedAt: new Date()
      });
      
      console.log('✅ Updated client stage to: discovery_complete');
    } else {
      const clientDoc = snapshot.docs[0];
      const clientData = clientDoc.data();
      
      console.log(`Found client: ${clientData.name} - ${clientData.company}`);
      console.log(`Current stage: ${clientData.onboardingStage}`);
      
      // Update to discovery_complete stage
      await db.collection('clients').doc(clientDoc.id).update({
        onboardingStage: 'discovery_complete',
        updatedAt: new Date()
      });
      
      console.log('✅ Updated client stage to: discovery_complete');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateClientStage();
