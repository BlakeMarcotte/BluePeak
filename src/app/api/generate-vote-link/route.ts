import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Generate a short random ID for the voting link
function generateVoteId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, originalContentId } = await request.json();

    if (!clientId || !originalContentId) {
      return NextResponse.json(
        { error: 'Client ID and original content ID are required' },
        { status: 400 }
      );
    }

    // Fetch the client
    const clientRef = adminDb.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();

    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const clientData = clientDoc.data();
    const marketingContent = clientData?.marketingContent || [];

    // Find the original content and its variant
    const originalContent = marketingContent.find((c: any) => c.id === originalContentId);
    if (!originalContent) {
      return NextResponse.json(
        { error: 'Original content not found' },
        { status: 404 }
      );
    }

    const variantContent = marketingContent.find(
      (c: any) => c.variantOfId === originalContentId && c.published
    );

    if (!variantContent) {
      return NextResponse.json(
        { error: 'No variant found for this content. Generate a variant first.' },
        { status: 404 }
      );
    }

    // Generate or reuse existing public vote ID
    const publicVoteId = originalContent.publicVoteId || generateVoteId();

    // Update both original and variant with the public vote ID and initialize votes
    const updatedContent = marketingContent.map((c: any) => {
      if (c.id === originalContentId) {
        return {
          ...c,
          publicVoteId,
          votes: c.votes || 0,
        };
      }
      if (c.id === variantContent.id) {
        return {
          ...c,
          publicVoteId,
          votes: c.votes || 0,
        };
      }
      return c;
    });

    // Save to database
    await clientRef.update({
      marketingContent: updatedContent,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      publicVoteId,
      voteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/vote/${publicVoteId}`,
    });
  } catch (error) {
    console.error('Error generating vote link:', error);
    return NextResponse.json(
      { error: 'Failed to generate vote link' },
      { status: 500 }
    );
  }
}
