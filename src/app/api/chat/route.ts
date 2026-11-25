import { NextRequest } from 'next/server';
import { streamGemini, streamOpenAI } from '@/lib/ai-provider';
import { ChatMessage, AIModelId } from '@/lib/types';

export const maxDuration = 120; // 2 minutes for large document reasoning

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      model = 'gemini-2.0-flash',
      geminiApiKey: customGeminiKey,
      openaiApiKey: customOpenAIKey,
    }: {
      messages: ChatMessage[];
      model: AIModelId;
      geminiApiKey?: string;
      openaiApiKey?: string;
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Danh sách tin nhắn không được để trống.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isGemini = model.startsWith('gemini');
    const isGPT = model.startsWith('gpt');

    // 1. Handle Gemini
    if (isGemini) {
      const apiKey = customGeminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error:
              'Chưa có Gemini API Key. Bạn có thể bấm vào nút "Cài đặt API" ở góc trên bên phải để nhập API Key từ Google AI Studio (miễn phí).',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const stream = streamGemini(messages, model, apiKey);
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          } catch (err) {
            console.error('Gemini streaming error:', err);
            controller.error(err);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    // 2. Handle OpenAI
    if (isGPT) {
      const apiKey = customOpenAIKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error:
              'Chưa có OpenAI API Key. Bạn có thể bấm vào nút "Cài đặt API" ở góc trên bên phải để nhập OpenAI API Key.',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const stream = streamOpenAI(messages, model, apiKey);
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          } catch (err) {
            console.error('OpenAI streaming error:', err);
            controller.error(err);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    }

    return new Response(JSON.stringify({ error: `Model ${model} không được hỗ trợ.` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Lỗi xử lý phản hồi từ AI.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
