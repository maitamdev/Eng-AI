import { NextResponse } from 'next/server';
import { groq, MODELS } from '@/lib/groq/client';
import { SYSTEM_PROMPTS } from '@/lib/groq/prompts';

export async function POST(req: Request) {
  try {
    const { skill, level } = await req.json();

    const systemPrompt = SYSTEM_PROMPTS.lesson_generator(
      skill || 'grammar',
      level || 'intermediate'
    );

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Generate a personalized lesson now.',
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const resultText = completion.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error('Groq lesson generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Error generating lesson content' },
      { status: 500 }
    );
  }
}
