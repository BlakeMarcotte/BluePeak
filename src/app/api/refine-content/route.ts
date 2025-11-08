import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RefineRequest {
  originalContent: string;
  refinementNotes: string;
  contentType: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefineRequest = await request.json();
    const { originalContent, refinementNotes, contentType } = body;

    if (!originalContent || !refinementNotes) {
      return NextResponse.json(
        { error: 'Original content and refinement notes are required' },
        { status: 400 }
      );
    }

    const prompt = `You are helping refine ${contentType} marketing content.

Original Content:
${originalContent}

User's Refinement Request:
${refinementNotes}

Please revise the content according to the user's request. Maintain the same format and structure unless specifically asked to change it. Keep the same general length unless asked to shorten or expand.

Revised Content:`;

    // Generate refined content with Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the text response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const refinedContent = textContent.text;

    return NextResponse.json({
      content: refinedContent,
    });
  } catch (error) {
    console.error('Error refining content:', error);
    return NextResponse.json(
      { error: 'Failed to refine content' },
      { status: 500 }
    );
  }
}
