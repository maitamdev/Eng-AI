import { NextResponse } from 'next/server';
import { groq, MODELS } from '@/lib/groq/client';
import { SYSTEM_PROMPTS } from '@/lib/groq/prompts';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { topic, difficulty } = await req.json();

    // Check key
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API Key is not configured' }, { status: 500 });
    }

    // Cast SYSTEM_PROMPTS to any to avoid strict TS key typing if needed, 
    // but reading_generator exists now. We will call it directly.
    const systemPrompt = (SYSTEM_PROMPTS as any).reading_generator(
      topic || 'general',
      difficulty || 'intermediate'
    );

    // Call Groq API
    const response = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the reading comprehension exercise JSON now.' },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Groq reading generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Error processing reading generation' },
      { status: 500 }
    );
  }
}
