import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory } = await request.json();

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json(
        { error: 'Conversation history is required' },
        { status: 400 }
      );
    }

    // Format the conversation for context
    const conversationContext = conversationHistory
      .map((msg: any) => `${msg.role === 'assistant' ? 'Consultant' : 'Client'}: ${msg.content}`)
      .join('\n\n');

    const prompt = `Based on the following discovery call conversation, create a comprehensive and professional marketing proposal for BluePeak Marketing.

DISCOVERY CALL TRANSCRIPT:
${conversationContext}

Create a detailed proposal with the following sections:

1. EXECUTIVE SUMMARY (2-3 paragraphs)
   - Brief overview of the client's needs and our proposed solution
   - Key value propositions
   - Expected outcomes

2. SCOPE OF WORK (detailed bullet points)
   - Specific services we'll provide
   - What's included and what's not
   - Deliverables with clear descriptions

3. TIMELINE (structured breakdown)
   - Phase-by-phase timeline
   - Key milestones
   - Expected completion dates

4. INVESTMENT (clear pricing structure)
   - Pricing breakdown by service
   - Total investment
   - Payment terms

5. DELIVERABLES (comprehensive list)
   - All tangible outputs the client will receive
   - Formats and quantities

Format the response as valid JSON with this structure:
{
  "executiveSummary": "string",
  "scopeOfWork": "string with markdown formatting",
  "timeline": "string with markdown formatting",
  "pricing": "string with markdown formatting",
  "deliverables": ["array", "of", "strings"]
}

Make it professional, specific to their needs, and persuasive. Use their company name and specific details from the conversation.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse the JSON response from Claude
    let proposalData;
    try {
      // Extract JSON from the response (Claude might wrap it in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        proposalData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse proposal JSON:', parseError);
      // Fallback: return the raw content
      proposalData = {
        executiveSummary: content.substring(0, 500),
        scopeOfWork: content,
        timeline: 'To be discussed',
        pricing: 'Custom pricing based on scope',
        deliverables: ['Detailed deliverables to be finalized'],
      };
    }

    return NextResponse.json(proposalData);
  } catch (error) {
    console.error('Proposal generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate proposal' },
      { status: 500 }
    );
  }
}
