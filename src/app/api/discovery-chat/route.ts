import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DISCOVERY_SYSTEM_PROMPT = `You are conducting a structured discovery questionnaire for BluePeak Marketing. You must ask these 3 questions in order, naturally and conversationally:

1. What are your main marketing goals right now?
2. Who is your target audience or ideal customer?
3. What specific marketing services are you interested in? (For example: SEO, social media management, content creation, paid advertising, email marketing, etc.)

Guidelines:
- Ask questions in order, ONE AT A TIME
- Do NOT label them as "QUESTION 1" or similar - just ask the question naturally
- After they answer, move to the next question
- Only ask follow-up questions if their answer is vague or unclear (e.g., "Can you be more specific about that?")
- If you can't get a clear answer after one follow-up attempt, or their answers don't make sense, just move on to the next question
- Do NOT ask about budget, timeline, company name, or industry - we already have that information
- Keep your responses warm and friendly but concise
- After all 3 questions are answered (or attempted), end the conversation

IMPORTANT: When you have clear answers to all 3 questions, respond with: "Thank you so much for sharing all of this! That's everything we need to get started. Our team at BluePeak will review your responses and get back to you shortly with a customized proposal tailored to your needs."`;

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
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: DISCOVERY_SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    return NextResponse.json({
      message: assistantMessage,
      isComplete: assistantMessage.toLowerCase().includes("that's everything we need") ||
                  assistantMessage.toLowerCase().includes("get back to you shortly") ||
                  assistantMessage.toLowerCase().includes("our team at bluepeak will review"),
    });
  } catch (error) {
    console.error('Discovery chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
