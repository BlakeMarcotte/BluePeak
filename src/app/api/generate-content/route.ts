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
  notes?: string;
  clientEmail?: string;
  clientPhone?: string;
}

function getPromptForContentType(
  contentType: ContentType,
  data: GenerateRequest
): string {
  const { clientName, industry, topic, targetAudience, brandVoice, brandProfile, notes } = data;

  const brandContext = brandProfile
    ? `\n\nBrand Profile:
- Colors: ${brandProfile.colors.join(', ')}
- Visual Style: ${brandProfile.style}
- Personality: ${brandProfile.personality.join(', ')}
- Tone: ${brandProfile.tone}`
    : '';

  const voiceContext = brandVoice ? `\n\nBrand Voice Notes: ${brandVoice}` : '';
  const notesContext = notes ? `\n\nSpecific Requirements for This Content:\n${notes}` : '';

  switch (contentType) {
    case 'blog':
      return `Write a professional blog post for ${clientName}, a ${industry} company.

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}${notesContext}

Requirements:
- 800-1200 words
- SEO-optimized with keyword integration
- Clear structure with headers (H2, H3)
- Engaging introduction with hook
- Data-driven or example-based body
- Strong conclusion with CTA
- Professional tone matching the brand

Write the complete blog post:`;

    case 'linkedin':
      return `Write a professional LinkedIn post for ${clientName}, a ${industry} company.

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}${notesContext}

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
Target Audience: ${targetAudience}${brandContext}${voiceContext}${notesContext}

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
Target Audience: ${targetAudience}${brandContext}${voiceContext}${notesContext}

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
Target Audience: ${targetAudience}${brandContext}${voiceContext}${notesContext}

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

    case 'pdf-onepager':
      return `Generate structured content for a professional one-page PDF marketing piece for ${clientName}, a ${industry} company.

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}${notesContext}

You must respond with ONLY a valid JSON object (no markdown code blocks, no explanation) with this exact structure:
{
  "headline": "Compelling main headline (max 60 characters)",
  "subheadline": "Supporting subheadline that expands on the headline (max 120 characters)",
  "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
  "stats": [
    {"value": "stat number/percentage", "label": "what it represents"},
    {"value": "stat number/percentage", "label": "what it represents"},
    {"value": "stat number/percentage", "label": "what it represents"}
  ],
  "callToAction": "Clear, action-oriented CTA (max 80 characters)"
}

Requirements:
- Headline should grab attention and communicate core value
- Subheadline should expand on the promise
- Key benefits: 4 clear, specific benefits (each 10-15 words)
- Stats: 3 impressive, relevant metrics with clear labels
- CTA: Compelling call to action
${brandProfile ? `- Tone: ${brandProfile.tone}` : ''}
${brandProfile ? `- Personality: ${brandProfile.personality.join(', ')}` : ''}

Return ONLY the JSON object, no other text:`;

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

    // Determine max_tokens based on content type
    // Blog posts need much more tokens (800-1200 words = ~4000-6000 tokens)
    const maxTokensByType: Record<ContentType, number> = {
      'blog': 8000,           // Full blog posts need lots of tokens
      'linkedin': 2000,       // LinkedIn posts are shorter
      'twitter': 2000,        // Twitter threads are short
      'email': 3000,          // Emails are medium length
      'ad-copy': 1500,        // Ad copy is very short
      'pdf-onepager': 2000,   // PDF data is structured and compact
    };

    const maxTokens = maxTokensByType[contentType] || 4000;

    // Generate content with Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
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

    let content = textContent.text;
    const wordCount = content.split(/\s+/).length;
    const characterCount = content.length;

    // For PDF one-pager, parse JSON and return structured data
    if (contentType === 'pdf-onepager') {
      try {
        // Remove markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;

        const pdfData = JSON.parse(jsonString.trim());

        // Add real client contact info
        pdfData.contactInfo = {
          email: body.clientEmail || 'contact@example.com',
          phone: body.clientPhone || '(555) 123-4567',
        };

        return NextResponse.json({
          content: JSON.stringify(pdfData, null, 2),
          wordCount,
          characterCount,
          pdfData, // Include parsed PDF data with real contact info
        });
      } catch (parseError) {
        console.error('Failed to parse PDF JSON:', parseError);
        // Fallback: return as regular content
        return NextResponse.json({
          content,
          wordCount,
          characterCount,
        });
      }
    }

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
