import { NextResponse } from 'next/server';
import { groq, MODELS } from '@/lib/groq/client';

export async function POST(req: Request) {
  try {
    const { type, topic, difficulty } = await req.json();

    let systemPrompt = '';

    if (type === 'dictation') {
      systemPrompt = `
You are an expert English listening instructor.
Generate exactly one listening dictation practice item for an English learner.
Topic: ${topic || 'general'}
Difficulty level: ${difficulty || 'medium'} (easy / medium / hard)

Requirements:
- Easy: short sentence, 1-2 easy blank words (e.g. verbs, nouns).
- Medium: 1-2 standard sentences, 2-3 blank words (e.g. prepositions, adjectives, vocabulary).
- Hard: a longer compound sentence, 3-4 blank words (challenging words).

You MUST output ONLY a valid, parseable JSON object matching this structure (no markdown fences, no text outside JSON):
{
  "sentence_with_blanks": "the sentence with _____ replacing the blank words (e.g. 'I would like to _____ a table')",
  "correct_words": ["the", "first", "blank", "word", "in", "lowercase", "and", "so", "on"],
  "full_sentence": "the full completed sentence to read out (e.g. 'I would like to book a table')",
  "translation": "Vietnamese translation of the full sentence"
}
`;
    } else {
      systemPrompt = `
You are an expert English listening instructor.
Generate exactly one listening comprehension quiz for an English learner.
Topic: ${topic || 'general'}
Difficulty level: ${difficulty || 'medium'} (easy / medium / hard)

Requirements:
- Passage: A natural, interesting conversation or speech paragraph (50-120 words).
- Questions: Exactly 3 multiple choice questions based on the passage. Each question must have exactly 4 options.
- Explanations: Concise explanations in Vietnamese for why the correct option is right.

You MUST output ONLY a valid, parseable JSON object matching this structure (no markdown fences, no text outside JSON):
{
  "passage": "The English speech or dialogue text to read out",
  "translation": "Vietnamese translation of the entire passage",
  "questions": [
    {
      "question": "English question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A (must match one of the options exactly)",
      "explanation": "Explanation in Vietnamese why this option is correct"
    }
  ]
}
`;
    }

    const completion = await groq.chat.completions.create({
      model: MODELS.smart,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate one listening practice for type ${type} now.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const resultText = completion.choices[0]?.message?.content || '{}';
    const parsedData = JSON.parse(resultText);

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error('Groq listening generator error:', err);
    return NextResponse.json(
      { error: err.message || 'Error generating listening exercise' },
      { status: 500 }
    );
  }
}
