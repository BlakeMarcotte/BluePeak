import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { ContentType, BrandProfile } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface VariantRequest {
  originalContent: string;
  originalName: string;
  contentType: ContentType;
  clientName: string;
  industry: string;
  topic: string;
  targetAudience: string;
  brandVoice?: string;
  brandProfile?: BrandProfile;
  pdfData?: any; // For PDF variants
  clientEmail?: string;
  clientPhone?: string;
}

function getVariantPrompt(contentType: ContentType, data: VariantRequest): string {
  const { originalContent, clientName, industry, topic, targetAudience, brandVoice, brandProfile } = data;

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
      return `You are creating an A/B test variant for a blog post for ${clientName}, a ${industry} company.

Original Blog Post:
${originalContent}

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Create a VARIANT version that:
- Maintains the same word count (800-1200 words)
- Keeps the same core message and SEO focus
- Uses a DIFFERENT headline approach (e.g., if original was question-based, try statement-based)
- Varies the hook/introduction style
- Restructures some sections or examples differently
- Maintains professional tone but explores slight tonal variations
- Uses different vocabulary and phrasing while keeping the meaning

Write the complete variant blog post:`;

    case 'linkedin':
      return `You are creating an A/B test variant for a LinkedIn post for ${clientName}, a ${industry} company.

Original LinkedIn Post:
${originalContent}

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Create a VARIANT version that:
- Stays within 1300 characters
- Tests a DIFFERENT opening hook (e.g., question vs. statement, stat vs. story)
- Varies the structure (e.g., bullet points vs. paragraphs)
- Uses different CTA approach
- Keeps same hashtags but can reorder them
- Maintains core message but with fresh angle

Write the variant LinkedIn post:`;

    case 'twitter':
      return `You are creating an A/B test variant for a Twitter thread for ${clientName}, a ${industry} company.

Original Thread:
${originalContent}

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Create a VARIANT thread that:
- Same number of tweets (5-7)
- Each tweet max 280 characters
- DIFFERENT hook for first tweet
- Varies the narrative flow or order
- Tests different tone (e.g., more casual vs. more authoritative)
- Different CTA approach
- Include thread numbering

Write the complete variant thread:`;

    case 'email':
      return `You are creating an A/B test variant for a marketing email for ${clientName}, a ${industry} company.

Original Email:
${originalContent}

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Create a VARIANT email that:
- DIFFERENT subject line approach (test urgency, curiosity, value, etc.)
- Different preview text
- Same length (200-400 words) but restructured
- Varies the opening hook
- Different CTA wording and placement
- Maintains core message

Format:
SUBJECT: [subject line]
PREVIEW: [preview text]
BODY: [email content]

Write the complete variant email:`;

    case 'ad-copy':
      return `You are creating an A/B test variant for ad copy for ${clientName}, a ${industry} company.

Original Ad Copy:
${originalContent}

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Create a VARIANT ad that:
- DIFFERENT headline approach (benefit vs. feature, question vs. statement)
- Varies description emphasis
- Tests different CTA wording
- Maintains character limits
- Same core value prop, different angle

Format:
HEADLINE: [headline]
DESCRIPTION: [short description]
LONG DESCRIPTION: [longer description]
CTA: [call to action]

Write the variant ad copy:`;

    case 'pdf-onepager':
      return `You are creating an A/B test variant for a PDF one-pager for ${clientName}, a ${industry} company.

Original PDF Content:
${originalContent}

Topic: ${topic}
Target Audience: ${targetAudience}${brandContext}${voiceContext}

Create a VARIANT version testing different angles. You must respond with ONLY a valid JSON object (no markdown code blocks, no explanation) with this exact structure:
{
  "headline": "DIFFERENT compelling headline approach (max 60 characters)",
  "subheadline": "Varied supporting subheadline (max 120 characters)",
  "keyBenefits": ["Reframed Benefit 1", "Reframed Benefit 2", "Reframed Benefit 3", "Reframed Benefit 4"],
  "stats": [
    {"value": "stat number/percentage", "label": "what it represents"},
    {"value": "stat number/percentage", "label": "what it represents"},
    {"value": "stat number/percentage", "label": "what it represents"}
  ],
  "callToAction": "Different CTA approach (max 80 characters)"
}

Variant Requirements:
- Test DIFFERENT headline angle (emotional vs. logical, benefit vs. transformation)
- Reframe subheadline with fresh perspective
- Reword benefits emphasizing different aspects
- Keep same stats but can vary labels slightly
- Test different CTA wording
- Maintain same tone but explore variations

Return ONLY the JSON object, no other text:`;

    default:
      return 'Generate a variant of the marketing content.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: VariantRequest = await request.json();

    const { contentType, originalContent } = body;

    if (!contentType || !originalContent) {
      return NextResponse.json(
        { error: 'Content type and original content are required' },
        { status: 400 }
      );
    }

    const prompt = getVariantPrompt(contentType, body);

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

    // Generate variant with Claude
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

        // Add real client contact info (same as original)
        pdfData.contactInfo = {
          email: body.clientEmail || 'contact@example.com',
          phone: body.clientPhone || '(555) 123-4567',
        };

        return NextResponse.json({
          content: JSON.stringify(pdfData, null, 2),
          wordCount,
          characterCount,
          pdfData,
        });
      } catch (parseError) {
        console.error('Failed to parse PDF JSON:', parseError);
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
    console.error('Error generating variant:', error);
    return NextResponse.json(
      { error: 'Failed to generate variant' },
      { status: 500 }
    );
  }
}
