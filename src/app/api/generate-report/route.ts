import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TONE_INSTRUCTIONS = {
  formal: 'Use a professional, formal business tone. Be respectful and corporate.',
  casual: 'Use a friendly, conversational tone while maintaining professionalism. Be warm and approachable.',
  detailed: 'Provide extensive detail and context. Include technical specifics and comprehensive explanations.',
};

export async function POST(request: NextRequest) {
  try {
    const { reportData, tone = 'casual' } = await request.json();

    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    const {
      clientName,
      reportPeriod,
      completedTasks,
      metrics,
      upcomingDeliverables,
      blockers,
      highlights,
    } = reportData;

    const prompt = `You are writing a progress update email for BluePeak Marketing to send to their client. Transform the following raw data into a professional, engaging progress report.

CLIENT: ${clientName}
REPORT PERIOD: ${reportPeriod}

COMPLETED TASKS:
${completedTasks?.map((task: string) => `- ${task}`).join('\n') || 'None specified'}

KEY METRICS:
${metrics?.map((m: any) => `- ${m.label}: ${m.value}`).join('\n') || 'None specified'}

UPCOMING DELIVERABLES:
${upcomingDeliverables?.map((d: string) => `- ${d}`).join('\n') || 'None specified'}

${blockers ? `BLOCKERS/ISSUES:\n${blockers}` : ''}

${highlights ? `HIGHLIGHTS:\n${highlights}` : ''}

TONE INSTRUCTION: ${TONE_INSTRUCTIONS[tone as keyof typeof TONE_INSTRUCTIONS]}

Write a professional progress report email that:
1. Starts with a warm greeting addressing ${clientName}
2. Highlights completed work in an engaging narrative (not just a list)
3. Presents metrics as achievements and insights
4. Discusses upcoming work with enthusiasm
5. Addresses any blockers diplomatically if present
6. Ends with an invitation for feedback or questions
7. Signs off professionally

The email should feel personal and show genuine care for the client's success. Transform dry data into a compelling story of progress and results.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const generatedReport = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    return NextResponse.json({
      report: generatedReport,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
