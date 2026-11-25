import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { Attachment, ChatMessage, AIModelId } from './types';

export interface ChatRequestOptions {
  messages: ChatMessage[];
  model: AIModelId;
  geminiApiKey?: string;
  openaiApiKey?: string;
  groqApiKey?: string;
}

/**
 * Prepares user message content with all attachments (images, PDFs, text, tables)
 */
function buildUserContentParts(message: ChatMessage) {
  const parts: Array<{
    type: 'text' | 'image' | 'file';
    text?: string;
    mimeType?: string;
    data?: string;
    name?: string;
  }> = [];

  // 1. Process attachments
  if (message.attachments && message.attachments.length > 0) {
    for (const att of message.attachments) {
      if (att.data && (att.mimeType.startsWith('image/') || att.mimeType === 'application/pdf')) {
        parts.push({
          type: 'file',
          name: att.name,
          mimeType: att.mimeType,
          data: att.data,
        });
      }

      if (att.extractedText) {
        let label = 'TỆP ĐÍNH KÈM';
        if (att.type === 'clipboard-table') label = 'BẢNG DỮ LIỆU EXCEL TỪ CLIPBOARD';
        if (att.type === 'clipboard-text') label = 'VĂN BẢN TỪ CLIPBOARD';
        if (att.type === 'onedrive') label = 'TỆP TẢI VỀ TỪ ONEDRIVE';

        parts.push({
          type: 'text',
          text: `\n\n=== [${label}: ${att.name}] ===\n${att.extractedText}\n=== [HẾT TỆP: ${att.name}] ===\n\n`,
        });
      }
    }
  }

  // 2. Add user text prompt
  parts.push({
    type: 'text',
    text: message.content || 'Hãy phân tích và tóm tắt thông tin từ các tệp/dữ liệu đính kèm trên.',
  });

  return parts;
}

/**
 * Stream responses from Groq (100% Free via Llama 3.3 70B)
 */
export async function* streamGroq(
  messages: ChatMessage[],
  modelId: string,
  apiKey: string
): AsyncGenerator<string, void, unknown> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedMessages: any[] = [
    {
      role: 'system',
      content:
        'Bạn là DocAI Agent - trợ lý văn phòng thông minh. Khi người dùng cung cấp bảng tính hoặc dữ liệu, hãy phân tích kỹ lưỡng và luôn trình bày kết quả thành BẢNG MARKDOWN chuẩn (để người dùng có thể bấm nút Xuất Excel tải về). Trả lời bằng tiếng Việt rõ ràng, logic.',
    },
  ];

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      formattedMessages.push({
        role: 'assistant',
        content: msg.content,
      });
    } else {
      const partsObj = buildUserContentParts(msg);
      let textContent = '';

      for (const p of partsObj) {
        if (p.text) {
          textContent += p.text + '\n';
        }
      }

      formattedMessages.push({
        role: 'user',
        content: textContent.trim(),
      });
    }
  }

  const stream = await client.chat.completions.create({
    model: modelId || 'llama-3.3-70b-versatile',
    messages: formattedMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) {
      yield text;
    }
  }
}

/**
 * Stream responses from Gemini (via @google/genai)
 */
export async function* streamGemini(
  messages: ChatMessage[],
  modelId: string,
  apiKey: string
): AsyncGenerator<string, void, unknown> {
  const ai = new GoogleGenAI({ apiKey });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isUser = msg.role === 'user';
    const role = isUser ? 'user' : 'model';

    if (isUser) {
      const partsObj = buildUserContentParts(msg);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts: any[] = [];

      for (const p of partsObj) {
        if (p.type === 'file' && p.data && p.mimeType) {
          parts.push({
            inlineData: {
              mimeType: p.mimeType,
              data: p.data,
            },
          });
        } else if (p.type === 'text' && p.text) {
          parts.push({
            text: p.text,
          });
        }
      }

      contents.push({ role, parts });
    } else {
      contents.push({
        role,
        parts: [{ text: msg.content }],
      });
    }
  }

  let actualModel = modelId;
  if (modelId === 'gemini-2.0-flash') {
    actualModel = 'gemini-2.0-flash';
  } else if (modelId === 'gemini-1.5-pro') {
    actualModel = 'gemini-1.5-pro';
  }

  const responseStream = await ai.models.generateContentStream({
    model: actualModel,
    contents,
    config: {
      systemInstruction: {
        parts: [
          {
            text: `Bạn là DocAI Agent - trợ lý văn phòng và phân tích tài liệu thông minh (chuyên gia Excel, PDF, Word, hóa đơn và đối chiếu số liệu).
Quy tắc hành động:
1. Khi người dùng cung cấp bảng tính (Excel/CSV) hoặc tài liệu, hãy phân tích kỹ lưỡng, đối chiếu số liệu và phát hiện các điểm bất thường (nếu có).
2. Khi tổng hợp số liệu hoặc phân loại dữ liệu, LUÔN trình bày dưới dạng BẢNG MARKDOWN chuẩn (với tiêu đề cột rõ ràng) để người dùng có thể bấm nút "Xuất Excel (.xlsx)" tải về trực tiếp chỉ với 1 cú click chuột.
3. Nếu người dùng đưa nhiều tệp, hãy chủ động so sánh chéo các tệp, tìm sự chênh lệch và đưa ra kết luận rõ ràng.
4. Trả lời bằng tiếng Việt chuyên nghiệp, súc tích, logic và luôn sẵn sàng hỗ trợ các bước tiếp theo.`,
          },
        ],
      },
    },
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

/**
 * Stream responses from OpenAI (via openai)
 */
export async function* streamOpenAI(
  messages: ChatMessage[],
  modelId: string,
  apiKey: string
): AsyncGenerator<string, void, unknown> {
  const client = new OpenAI({ apiKey });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedMessages: any[] = [
    {
      role: 'system',
      content:
        'Bạn là DocAI Agent - trợ lý văn phòng thông minh. Khi người dùng cung cấp bảng tính hoặc dữ liệu, hãy phân tích kỹ lưỡng và luôn trình bày kết quả thành BẢNG MARKDOWN chuẩn (để người dùng có thể bấm nút Xuất Excel tải về). Trả lời bằng tiếng Việt chuyên nghiệp.',
    },
  ];

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      formattedMessages.push({
        role: 'assistant',
        content: msg.content,
      });
    } else {
      const partsObj = buildUserContentParts(msg);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentParts: any[] = [];

      for (const p of partsObj) {
        if (p.type === 'file' && p.data && p.mimeType && p.mimeType.startsWith('image/')) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${p.mimeType};base64,${p.data}`,
            },
          });
        } else if (p.text) {
          contentParts.push({
            type: 'text',
            text: p.text,
          });
        }
      }

      formattedMessages.push({
        role: 'user',
        content: contentParts.length === 1 && contentParts[0].type === 'text' 
          ? contentParts[0].text 
          : contentParts,
      });
    }
  }

  const stream = await client.chat.completions.create({
    model: modelId,
    messages: formattedMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) {
      yield text;
    }
  }
}
