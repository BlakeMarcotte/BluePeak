import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { logoUrl, screenshotUrl } = await request.json();

    if (!logoUrl && !screenshotUrl) {
      return NextResponse.json(
        { error: 'At least one image URL is required' },
        { status: 400 }
      );
    }

    // Fetch images as base64
    const images = [];

    if (logoUrl) {
      const logoResponse = await fetch(logoUrl);
      const logoBuffer = await logoResponse.arrayBuffer();
      const logoBase64 = Buffer.from(logoBuffer).toString('base64');
      images.push({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: logoBase64,
        },
      });
    }

    if (screenshotUrl) {
      const screenshotResponse = await fetch(screenshotUrl);
      const screenshotBuffer = await screenshotResponse.arrayBuffer();
      const screenshotBase64 = Buffer.from(screenshotBuffer).toString('base64');
      images.push({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: screenshotBase64,
        },
      });
    }

    // Analyze brand with Claude Vision
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            ...images,
            {
              type: 'text',
              text: `Analyze these brand assets (logo and/or website screenshot) and extract:

1. Primary brand colors (provide hex codes)
2. Design style (e.g., modern, minimal, playful, corporate, elegant)
3. Brand personality traits (3-5 adjectives)
4. Overall tone (e.g., professional, friendly, authoritative, casual)

Return ONLY a JSON object in this exact format:
{
  "colors": ["#hexcode1", "#hexcode2", "#hexcode3"],
  "style": "description of visual style",
  "personality": ["trait1", "trait2", "trait3"],
  "tone": "overall tone description"
}`,
            },
          ],
        },
      ],
    });

    // Extract the text response
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    const brandProfile = JSON.parse(textContent.text);

    return NextResponse.json({ brandProfile });
  } catch (error) {
    console.error('Error analyzing brand:', error);
    return NextResponse.json(
      { error: 'Failed to analyze brand' },
      { status: 500 }
    );
  }
}
