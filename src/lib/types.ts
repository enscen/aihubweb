export type AttachmentType = 
  | 'file' 
  | 'onedrive' 
  | 'clipboard-image' 
  | 'clipboard-table' 
  | 'clipboard-text';

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  size?: number;
  data?: string;
  extractedText?: string;
  originalUrl?: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
}

export type AIModelId = 
  | 'llama-3.3-70b-versatile'
  | 'gemini-2.0-flash' 
  | 'gemini-1.5-pro' 
  | 'gpt-4o' 
  | 'gpt-4o-mini';

export interface AIModelOption {
  id: AIModelId;
  name: string;
  provider: 'gemini' | 'openai' | 'groq';
  badge: string;
  description: string;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    badge: '★ 100% Free - Không cần nạp tiền',
    description: 'Không cần thẻ tín dụng, lấy key trong 10 giây, cực kỳ thông minh và phân tích văn bản/bảng biểu siêu tốc.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    badge: 'Google AI (Context 1M)',
    description: 'Tốc độ cực nhanh, xử lý tài liệu lớn, PDF, Excel xuất sắc.',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    badge: 'Google AI (Context 2M)',
    description: 'Chuyên gia đọc sách, tài liệu nghiên cứu và đối chiếu bảng biểu phức tạp.',
  },
  {
    id: 'gpt-4o',
    name: 'ChatGPT (GPT-4o)',
    provider: 'openai',
    badge: 'OpenAI (Cần nạp tiền API)',
    description: 'Tư duy logic mạnh mẽ, hành văn tự nhiên, tóm tắt và phân tích chuyên sâu.',
  },
  {
    id: 'gpt-4o-mini',
    name: 'ChatGPT (GPT-4o Mini)',
    provider: 'openai',
    badge: 'OpenAI Tiết kiệm',
    description: 'Nhanh, gọn cho các tác vụ hỏi đáp thông thường.',
  },
];
