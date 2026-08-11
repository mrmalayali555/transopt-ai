import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    const systemPrompt = `You are TRANSOPT AI, the intelligent assistant for a public transport simulation network.
You have access to the current real-time state of the network. Answer the user's questions based on this data. Be concise, professional, and analytical.
Do not make up data outside of what is provided in the context. If you don't know something based on the context, say so.

CURRENT NETWORK STATE:
${context}`;

    const completion = await openai.chat.completions.create({
      model: "z-ai/glm-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 1,
      top_p: 1,
      max_tokens: 16384,
      seed: 42,
      stream: true
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
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
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
