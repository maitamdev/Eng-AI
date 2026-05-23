import { NextResponse } from 'next/server';
import { groq, MODELS } from '@/lib/groq/client';
import { SYSTEM_PROMPTS } from '@/lib/groq/prompts';

export async function POST(req: Request) {
  try {
    const { topic, difficulty } = await req.json();

    const systemPrompt = SYSTEM_PROMPTS.vocabulary_generator(
      topic || 'business',
      difficulty || 'medium'
    );

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Generate one interesting vocabulary word now.',
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const resultText = completion.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error('Groq vocabulary generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Error generating vocabulary card' },
      { status: 500 }
    );
  }
}
