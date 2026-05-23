import { NextResponse } from 'next/server';
import { groq, MODELS } from '@/lib/groq/client';

export async function POST(req: Request) {
  try {
    const { topic, difficulty } = await req.json();

    const systemPrompt = `
You are an expert English pronunciation coach.
Generate exactly one interesting, natural English practice sentence or short paragraph for an English learner.
Topic: ${topic || 'general'}
Difficulty level: ${difficulty || 'medium'} (easy / medium / hard)

Requirements:
- Easy: short simple sentences (5-8 words).
- Medium: standard compound sentences (8-15 words).
- Hard: complex sentences or a short paragraph (15-25 words).

You MUST output ONLY a valid, parseable JSON object matching this structure (no markdown fences, no conversational prefix/suffix, just raw JSON):
{
  "sentence": "the English sentence or paragraph to read",
  "translation": "Vietnamese translation of the text",
  "ipa": "Full IPA phonetic transcription of the text (e.g. /haʊ/)",
  "focus_words": ["word1", "word2"],
  "tips": "Detailed pronunciation tips in Vietnamese focusing on linkings, reductions, word stresses, or final consonant sounds."
}
`;

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Generate one interesting pronunciation sentence now.',
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
    });

    const resultText = completion.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error('Groq pronunciation generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Error generating pronunciation text' },
      { status: 500 }
    );
  }
}
