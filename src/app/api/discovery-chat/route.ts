import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DISCOVERY_SYSTEM_PROMPT = `You are conducting a structured discovery questionnaire for BluePeak Marketing.

IMPORTANT: The first question "What are your main marketing goals right now?" has ALREADY been asked in the initial greeting. You are continuing from there.

You need to gather answers to these 3 questions in order:

1. What are your main marketing goals right now? (ALREADY ASKED - just get clarification if needed)
2. Who is your target audience or ideal customer?
3. What specific marketing services are you interested in? (For example: SEO, social media management, content creation, paid advertising, email marketing, etc.)

Guidelines:
- For question 1: Since it's already asked, only ask a follow-up if their answer is vague (e.g., "Could you tell me more about that?")
- CRITICAL: When asking follow-ups, NEVER repeat the original question - just ask the clarifying question directly
- After getting a sufficient answer to question 1, move to question 2
- Ask questions in order, ONE AT A TIME
- Do NOT label them as "QUESTION 1" or similar - just ask naturally
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
