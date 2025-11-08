import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DISCOVERY_SYSTEM_PROMPT = `You are an expert business consultant helping BluePeak Marketing conduct discovery calls with potential clients. Your goal is to gather comprehensive information about their business needs in a conversational, friendly manner.

You should ask questions to understand:
1. Company name and industry
2. Business goals and objectives
3. Target audience and market
4. Current marketing challenges
5. Budget range for marketing services
6. Timeline and urgency
7. Specific services they're interested in (content marketing, social media, SEO, paid ads, etc.)
8. Any additional context that would help create a tailored proposal

Guidelines:
- Be conversational and warm, not robotic
- Ask one question at a time, don't overwhelm them
- Listen to their responses and ask intelligent follow-up questions
- If they mention a challenge, dig deeper to understand the root cause
- Keep responses concise and professional
- Once you have gathered sufficient information (around 7-10 exchanges), let them know you have everything needed to create their proposal and thank them

IMPORTANT: Structure your responses naturally. When you've gathered enough information, end with a clear signal like "That's all the information I need! I'll now prepare a customized proposal for you."`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: DISCOVERY_SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    return NextResponse.json({
      message: assistantMessage,
      isComplete: assistantMessage.toLowerCase().includes("that's all the information i need") ||
                  assistantMessage.toLowerCase().includes("i'll now prepare") ||
                  assistantMessage.toLowerCase().includes("ready to create your proposal"),
    });
  } catch (error) {
    console.error('Discovery chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
