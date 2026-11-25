import { NextRequest } from 'next/server';
import { streamGemini, streamOpenAI, streamGroq } from '@/lib/ai-provider';
import { ChatMessage, AIModelId } from '@/lib/types';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages,
      model = 'llama-3.3-70b-versatile',
      geminiApiKey: customGeminiKey,
      openaiApiKey: customOpenAIKey,
      groqApiKey: customGroqKey,
    }: {
      messages: ChatMessage[];
      model: AIModelId;
      geminiApiKey?: string;
      openaiApiKey?: string;
      groqApiKey?: string;
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Danh sách tin nhắn không được để trống.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Handle Groq (100% Free - Llama 3.3 70B)
    if (model.includes('llama') || model === 'llama-3.3-70b-versatile') {
      const apiKey = customGroqKey || process.env.GROQ_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error:
              'Chưa có Groq API Key. Bạn bấm vào nút "Cài đặt" ở góc trên bên phải để lấy Key miễn phí 100% trong 10 giây (không cần thẻ, không cần nạp tiền).',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const stream = streamGroq(messages, model, apiKey);
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          } catch (err) {
            console.error('Groq streaming error:', err);
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

    // 2. Handle Gemini
    if (model.startsWith('gemini')) {
      const apiKey = customGeminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error:
              'Chưa có Gemini API Key. Bạn có thể bấm vào nút "Cài đặt" để nhập Key hoặc chuyển sang dùng model Llama 3.3 (Groq) miễn phí 100%.',
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

    // 3. Handle OpenAI
    if (model.startsWith('gpt')) {
      const apiKey = customOpenAIKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error:
              'Chưa có OpenAI API Key. Bạn có thể bấm vào nút "Cài đặt" để nhập OpenAI Key.',
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
