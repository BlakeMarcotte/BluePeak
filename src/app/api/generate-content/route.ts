import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { ContentType, BrandProfile } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerateRequest {
  clientName: string;
  industry: string;
  topic: string;
  targetAudience: string;
  brandVoice?: string;
  brandProfile?: BrandProfile;
  contentType: ContentType;
}

function getPromptForContentType(
  contentType: ContentType,
  data: GenerateRequest
): string {
  const { clientName, industry, topic, targetAudience, brandVoice, brandProfile } = data;

  const brandContext = brandProfile
    ? `\n\nBrand Profile:
- Colors: ${brandProfile.colors.join(', ')}
- Visual Style: ${brandProfile.style}
- Personality: ${brandProfile.personality.join(', ')}
- Tone: ${brandProfile.tone}`
    : '';

  const voiceContext = brandVoice ? `\n\nBrand Voice Notes: ${brandVoice}` : '';

  switch (contentType) {
    case 'blog':
      return `Write a professional blog post for ${clientName}, a ${industry} company.

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Requirements:
- 800-1200 words
- SEO-optimized with keyword integration
- Clear structure with headers (H2, H3)
- Engaging introduction with hook
- Data-driven or example-based body
- Strong conclusion with CTA
- Professional tone matching the brand
${brandProfile ? `- Reference brand colors in image suggestions (e.g., "Feature a hero image with ${brandProfile.colors[0]} accents")` : ''}

Write the complete blog post:`;

    case 'linkedin':
      return `Write a professional LinkedIn post for ${clientName}, a ${industry} company.

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Requirements:
- Maximum 1300 characters
- Professional tone, engaging hook
- Include relevant insights or data
- End with clear CTA or question
- Use line breaks for readability
- Include 3-5 relevant hashtags
${brandProfile ? `- Tone should match: ${brandProfile.tone}` : ''}

Write the LinkedIn post:`;

    case 'twitter':
      return `Write a Twitter/X thread for ${clientName}, a ${industry} company.

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Requirements:
- 5-7 tweets forming a cohesive thread
- First tweet: Compelling hook (max 280 chars)
- Each tweet: Max 280 characters
- Include thread numbering (1/7, 2/7, etc.)
- Engaging, conversational tone
- End with CTA or engagement ask
- Include 2-3 relevant hashtags in final tweet
${brandProfile ? `- Voice: ${brandProfile.personality.join(', ')}` : ''}

Write the complete thread:`;

    case 'email':
      return `Write a marketing email for ${clientName}, a ${industry} company.

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Requirements:
- Compelling subject line (max 60 chars)
- Preview text (max 100 chars)
- Email body: 200-400 words
- Clear value proposition
- Scannable format (short paragraphs, bullets)
- Strong, specific CTA
- Professional yet approachable tone
${brandProfile ? `- Match brand tone: ${brandProfile.tone}` : ''}

Format:
SUBJECT: [subject line]
PREVIEW: [preview text]
BODY: [email content]

Write the complete email:`;

    case 'ad-copy':
      return `Write ad copy for ${clientName}, a ${industry} company.

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Requirements:
- Headline: Attention-grabbing, max 40 characters
- Description: Clear value prop, max 90 characters
- Long description: Detailed benefits, max 200 characters
- CTA: Action-oriented, max 20 characters
- Focus on benefits, not features
- Conversion-focused language
${brandProfile ? `- Personality: ${brandProfile.personality.join(', ')}` : ''}

Format:
HEADLINE: [headline]
DESCRIPTION: [short description]
LONG DESCRIPTION: [longer description]
CTA: [call to action]

Write the ad copy:`;

    default:
      return 'Generate marketing content.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    const { contentType } = body;

    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    const prompt = getPromptForContentType(contentType, body);

    // Generate content with Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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

    const content = textContent.text;
    const wordCount = content.split(/\s+/).length;
    const characterCount = content.length;

    return NextResponse.json({
      content,
      wordCount,
      characterCount,
    });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
