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
  data?: string; // base64 representation if image/pdf
  extractedText?: string; // extracted text content for docs/excel/txt
  originalUrl?: string; // for onedrive links
  previewUrl?: string; // object URL or data URL for UI preview
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  timestamp: number;
}

export type AIModelId = 
  | 'gemini-2.0-flash' 
  | 'gemini-1.5-pro' 
  | 'gpt-4o' 
  | 'gpt-4o-mini';

export interface AIModelOption {
  id: AIModelId;
  name: string;
  provider: 'gemini' | 'openai';
  badge: string;
  description: string;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    badge: 'Khuyên dùng - Cực nhanh & Context 1M',
    description: 'Tốc độ cực nhanh, xử lý tài liệu lớn, PDF, Excel xuất sắc và miễn phí cao.',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    badge: 'Context 2M - Tư duy sâu',
    description: 'Chuyên gia đọc sách, tài liệu nghiên cứu và đối chiếu bảng biểu phức tạp.',
  },
  {
    id: 'gpt-4o',
    name: 'ChatGPT (GPT-4o)',
    provider: 'openai',
    badge: 'OpenAI Đỉnh cao',
    description: 'Tư duy logic mạnh mẽ, hành văn tự nhiên, tóm tắt và phân tích chuyên sâu.',
  },
  {
    id: 'gpt-4o-mini',
    name: 'ChatGPT (GPT-4o Mini)',
    provider: 'openai',
    badge: 'Tiết kiệm token',
    description: 'Nhanh, gọn, chi phí thấp cho các tác vụ hỏi đáp thông thường.',
  },
];
