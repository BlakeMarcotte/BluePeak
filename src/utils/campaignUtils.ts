import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { Campaign, GeneratedContent } from '@/types';

// Save a new campaign to Firestore
export async function saveCampaign(campaignData: Omit<Campaign, 'id'>): Promise<string> {
  try {
    const campaignsRef = collection(db, 'campaigns');
    const docRef = await addDoc(campaignsRef, {
      ...campaignData,
      createdAt: Timestamp.fromDate(campaignData.createdAt),
      contents: campaignData.contents.map(content => ({
        ...content,
        generatedAt: Timestamp.fromDate(content.generatedAt),
      })),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving campaign:', error);
    throw new Error('Failed to save campaign');
  }
}

// Fetch all campaigns for a user
export async function fetchCampaigns(userId: string): Promise<Campaign[]> {
  try {
    const campaignsRef = collection(db, 'campaigns');
    const q = query(
      campaignsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        clientName: data.clientName,
        industry: data.industry,
        topic: data.topic,
        targetAudience: data.targetAudience,
        brandVoice: data.brandVoice,
        logoUrl: data.logoUrl,
        screenshotUrl: data.screenshotUrl,
        brandProfile: data.brandProfile,
        contents: (data.contents || []).map((content: any) => ({
          ...content,
          generatedAt: content.generatedAt?.toDate() || new Date(),
        })),
        userId: data.userId,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Campaign;
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error('Failed to fetch campaigns');
  }
}

// Fetch a single campaign by ID
export async function fetchCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignRef);

    if (!campaignDoc.exists()) {
      return null;
    }

    const data = campaignDoc.data();
    return {
      id: campaignDoc.id,
      clientName: data.clientName,
      industry: data.industry,
      topic: data.topic,
      targetAudience: data.targetAudience,
      brandVoice: data.brandVoice,
      logoUrl: data.logoUrl,
      screenshotUrl: data.screenshotUrl,
      brandProfile: data.brandProfile,
      contents: (data.contents || []).map((content: any) => ({
        ...content,
        generatedAt: content.generatedAt?.toDate() || new Date(),
      })),
      userId: data.userId,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as Campaign;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw new Error('Failed to fetch campaign');
  }
}

// Add generated content to an existing campaign
export async function saveGeneratedContent(
  campaignId: string,
  content: GeneratedContent
): Promise<void> {
  try {
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignDoc = await getDoc(campaignRef);

    if (!campaignDoc.exists()) {
      throw new Error('Campaign not found');
    }

    const existingContents = campaignDoc.data().contents || [];

    // Add new content with timestamp
    const newContent = {
      ...content,
      id: `${Date.now()}-${content.type}`,
      generatedAt: Timestamp.fromDate(content.generatedAt),
    };

    await updateDoc(campaignRef, {
      contents: [...existingContents, newContent],
    });
  } catch (error) {
    console.error('Error saving generated content:', error);
    throw new Error('Failed to save generated content');
  }
}
