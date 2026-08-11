import { NextResponse } from 'next/server';

const NVIDIA_API_KEY = "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";
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    const systemPrompt = `You are TRANSOPT AI, the intelligent assistant for a public transport simulation network.
You have access to the current real-time state of the network. Answer the user's questions based on this data. Be concise, professional, and analytical.
Do not make up data outside of what is provided in the context. If you don't know something based on the context, say so.

CURRENT NETWORK STATE:
${context}`;

    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API Error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch from NVIDIA API' }, { status: 500 });
    }

    // Create a ReadableStream to stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const reasoning = data.choices[0]?.delta?.reasoning_content;
                const content = data.choices[0]?.delta?.content;

                if (reasoning) {
                  // We can optionally handle reasoning, but for now we'll just stream content
                  // Or we can stream it as italicized text if we want. Let's just stick to content for a clean UI.
                }
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (e) {
                // Ignore parse errors from incomplete chunks
                console.error("Parse error chunk:", line, e);
              }
            }
          }
        }
        controller.close();
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
