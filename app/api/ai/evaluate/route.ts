import { NextResponse } from 'next/server';
import { groq, MODELS } from '@/lib/groq/client';
import { SYSTEM_PROMPTS } from '@/lib/groq/prompts';

export async function POST(req: Request) {
  try {
    const { content, prompt, writingType } = await req.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Submitted essay content is required' }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS.writing_evaluator(writingType || 'essay');

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Prompt/Topic: ${prompt || 'General Writing Practice'}\n\nSubmitted Content:\n${content}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const resultText = completion.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error('Groq writing evaluation error:', err);
    return NextResponse.json(
      { error: err.message || 'Error processing essay evaluation' },
      { status: 500 }
    );
  }
}
