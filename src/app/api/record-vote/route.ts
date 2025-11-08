import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { publicVoteId, selectedContentId } = await request.json();

    if (!publicVoteId || !selectedContentId) {
      return NextResponse.json(
        { error: 'Public vote ID and selected content ID are required' },
        { status: 400 }
      );
    }

    // Check if user has already voted (using cookie)
    const votedCookie = request.cookies.get(`voted_${publicVoteId}`);
    if (votedCookie) {
      return NextResponse.json(
        { error: 'You have already voted on this comparison' },
        { status: 403 }
      );
    }

    // Find the client with this public vote ID
    const clientsSnapshot = await adminDb.collection('clients').get();
    let foundClient: any = null;
    let foundClientId: string = '';

    for (const doc of clientsSnapshot.docs) {
      const clientData = doc.data();
      const marketingContent = clientData.marketingContent || [];

      const hasVoteId = marketingContent.some(
        (c: any) => c.publicVoteId === publicVoteId
      );

      if (hasVoteId) {
        foundClient = clientData;
        foundClientId = doc.id;
        break;
      }
    }

    if (!foundClient) {
      return NextResponse.json(
        { error: 'Voting session not found' },
        { status: 404 }
      );
    }

    // Update the vote count for the selected content
    const updatedContent = foundClient.marketingContent.map((c: any) => {
      if (c.id === selectedContentId && c.publicVoteId === publicVoteId) {
        return {
          ...c,
          votes: (c.votes || 0) + 1,
        };
      }
      return c;
    });

    // Save to database
    await adminDb.collection('clients').doc(foundClientId).update({
      marketingContent: updatedContent,
      updatedAt: new Date(),
    });

    // Get updated vote counts
    const originalContent = updatedContent.find(
      (c: any) => c.publicVoteId === publicVoteId && !c.variantOfId
    );
    const variantContent = updatedContent.find(
      (c: any) => c.publicVoteId === publicVoteId && c.variantOfId
    );

    // Set cookie to prevent duplicate voting (expires in 30 days)
    const response = NextResponse.json({
      success: true,
      originalVotes: originalContent?.votes || 0,
      variantVotes: variantContent?.votes || 0,
    });

    response.cookies.set(`voted_${publicVoteId}`, 'true', {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch vote data without voting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicVoteId = searchParams.get('publicVoteId');

    if (!publicVoteId) {
      return NextResponse.json(
        { error: 'Public vote ID is required' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const hasVoted = !!request.cookies.get(`voted_${publicVoteId}`);

    // Find the client with this public vote ID
    const clientsSnapshot = await adminDb.collection('clients').get();
    let foundClient: any = null;

    for (const doc of clientsSnapshot.docs) {
      const clientData = doc.data();
      const marketingContent = clientData.marketingContent || [];

      const hasVoteId = marketingContent.some(
        (c: any) => c.publicVoteId === publicVoteId
      );

      if (hasVoteId) {
        foundClient = clientData;
        break;
      }
    }

    if (!foundClient) {
      return NextResponse.json(
        { error: 'Voting session not found' },
        { status: 404 }
      );
    }

    // Find the original and variant content
    const originalContent = foundClient.marketingContent.find(
      (c: any) => c.publicVoteId === publicVoteId && !c.variantOfId
    );
    const variantContent = foundClient.marketingContent.find(
      (c: any) => c.publicVoteId === publicVoteId && c.variantOfId
    );

    if (!originalContent || !variantContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hasVoted,
      originalContent: {
        id: originalContent.id,
        name: originalContent.name,
        type: originalContent.type,
        content: originalContent.content,
        pdfData: originalContent.pdfData,
        votes: originalContent.votes || 0,
        variantLabel: originalContent.variantLabel || 'Original',
      },
      variantContent: {
        id: variantContent.id,
        name: variantContent.name,
        type: variantContent.type,
        content: variantContent.content,
        pdfData: variantContent.pdfData,
        votes: variantContent.votes || 0,
        variantLabel: variantContent.variantLabel || 'Variant',
      },
      clientName: foundClient.company || foundClient.name,
    });
  } catch (error) {
    console.error('Error fetching vote data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vote data' },
      { status: 500 }
    );
  }
}
