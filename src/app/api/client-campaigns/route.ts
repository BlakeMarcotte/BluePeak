import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get('clientName');

    if (!clientName) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    // Fetch campaigns where clientName matches (case-insensitive)
    const campaignsRef = adminDb.collection('campaigns');
    const snapshot = await campaignsRef
      .orderBy('createdAt', 'desc')
      .get();

    // Filter by clientName (case-insensitive matching)
    const campaigns = snapshot.docs
      .map((doc) => {
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
            id: content.id,
            type: content.type,
            content: content.content,
            wordCount: content.wordCount,
            characterCount: content.characterCount,
            generatedAt: content.generatedAt?.toDate?.() || new Date(),
            pdfData: content.pdfData,
          })),
          userId: data.userId,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      })
      .filter((campaign) =>
        campaign.clientName.toLowerCase().includes(clientName.toLowerCase())
      );

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching client campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
