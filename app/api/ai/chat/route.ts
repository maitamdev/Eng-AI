import { NextResponse } from 'next/server';
import { groq, MODELS } from '@/lib/groq/client';
import { SYSTEM_PROMPTS } from '@/lib/groq/prompts';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, scenario, level } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS.conversation(
      scenario || 'General Chat',
      level || 'intermediate'
    );

    // Call Groq API with streaming
    const response = await groq.chat.completions.create({
      model: MODELS.fast,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    });

    // Create a client-side stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Groq chat error:', err);
    return NextResponse.json(
      { error: err.message || 'Error processing conversation chat' },
      { status: 500 }
    );
  }
}
