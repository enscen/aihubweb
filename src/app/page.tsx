'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Paperclip,
  Cloud,
  Clipboard,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Attachment, ChatMessage, AIModelId, AVAILABLE_MODELS } from '@/lib/types';
import Header from '@/components/Header';
import AttachmentList from '@/components/AttachmentList';
import ChatMessageItem from '@/components/ChatMessageItem';
import SettingsModal from '@/components/SettingsModal';
import OneDriveModal from '@/components/OneDriveModal';
import Sidebar, { ChatSession } from '@/components/Sidebar';

/**
 * Converts tab-delimited Excel clipboard text to a Markdown table
 */
function convertExcelToMarkdown(text: string): string | null {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 1) return null;

  const hasTabs = lines.some((line) => line.includes('\t'));
  if (!hasTabs) return null;

  const rows = lines.map((line) => line.split('\t').map((c) => c.trim()));
  const colCount = Math.max(...rows.map((r) => r.length));

  // Build markdown table
  let md = '';
  // Header row (first row)
  const header = rows[0];
  md += '| ' + Array.from({ length: colCount }, (_, i) => header[i] || '').join(' | ') + ' |\n';
  md += '| ' + Array.from({ length: colCount }, () => '---').join(' | ') + ' |\n';

  // Body rows
  for (let r = 1; r < rows.length; r++) {
    md += '| ' + Array.from({ length: colCount }, (_, i) => rows[r][i] || '').join(' | ') + ' |\n';
  }

  return md;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModelId>('gemini-2.0-flash');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Chat sessions & history
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOneDriveOpen, setIsOneDriveOpen] = useState(false);

  // API keys stored in localStorage
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  // Detected OneDrive link in prompt
  const [detectedOneDriveUrl, setDetectedOneDriveUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API keys and chat sessions from localStorage
  useEffect(() => {
    const savedGroq = localStorage.getItem('docai_groq_key') || '';
    const savedGemini = localStorage.getItem('docai_gemini_key') || '';
    const savedOpenAI = localStorage.getItem('docai_openai_key') || '';
    const savedModel = (localStorage.getItem('docai_model') as AIModelId) || 'llama-3.3-70b-versatile';
    setGroqKey(savedGroq);
    setGeminiKey(savedGemini);
    setOpenaiKey(savedOpenAI);
    if (AVAILABLE_MODELS.some((m) => m.id === savedModel)) {
      setSelectedModel(savedModel);
    }

    try {
      const rawSessions = localStorage.getItem('docai_sessions');
      const loadedSessions: ChatSession[] = rawSessions ? JSON.parse(rawSessions) : [];
      let currentId = localStorage.getItem('docai_active_session');

      if (!currentId || !loadedSessions.some((s) => s.id === currentId)) {
        currentId = 'session-' + Date.now();
        const initialSession: ChatSession = {
          id: currentId,
          title: 'Đoạn chat mới',
          timestamp: Date.now(),
        };
        loadedSessions.unshift(initialSession);
        localStorage.setItem('docai_sessions', JSON.stringify(loadedSessions));
      }

      setSessions(loadedSessions);
      setActiveSessionId(currentId);
      localStorage.setItem('docai_active_session', currentId);

      const rawMsgs = localStorage.getItem('docai_msgs_' + currentId);
      if (rawMsgs) {
        setMessages(JSON.parse(rawMsgs));
      }
    } catch (e) {
      console.error('Failed to load sessions from storage:', e);
    }
  }, []);

  // Save active session messages
  useEffect(() => {
    if (!activeSessionId) return;
    try {
      localStorage.setItem('docai_msgs_' + activeSessionId, JSON.stringify(messages));

      // Auto update session title if still default
      if (messages.length > 0) {
        const firstUserMsg = messages.find((m) => m.role === 'user');
        if (firstUserMsg) {
          const newTitle = firstUserMsg.content
            ? firstUserMsg.content.slice(0, 28)
            : firstUserMsg.attachments?.[0]?.name || 'Tài liệu phân tích';

          setSessions((prev) => {
            const current = prev.find((s) => s.id === activeSessionId);
            if (current && current.title === 'Đoạn chat mới') {
              const updated = prev.map((s) =>
                s.id === activeSessionId ? { ...s, title: newTitle } : s
              );
              localStorage.setItem('docai_sessions', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.error('Failed to save session messages:', e);
    }
  }, [messages, activeSessionId]);

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    localStorage.setItem('docai_active_session', id);
    try {
      const rawMsgs = localStorage.getItem('docai_msgs_' + id);
      setMessages(rawMsgs ? JSON.parse(rawMsgs) : []);
    } catch {
      setMessages([]);
    }
    setAttachments([]);
  };

  const handleNewSession = () => {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'Đoạn chat mới',
      timestamp: Date.now(),
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newId);
    setMessages([]);
    setAttachments([]);
    localStorage.setItem('docai_sessions', JSON.stringify(updated));
    localStorage.setItem('docai_active_session', newId);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem('docai_sessions', JSON.stringify(updated));
    localStorage.removeItem('docai_msgs_' + id);

    if (activeSessionId === id) {
      if (updated.length > 0) {
        handleSelectSession(updated[0].id);
      } else {
        handleNewSession();
      }
    }
  };

  const handleSaveKeys = (gqKey: string, gKey: string, oKey: string) => {
    setGroqKey(gqKey);
    setGeminiKey(gKey);
    setOpenaiKey(oKey);
    localStorage.setItem('docai_groq_key', gqKey);
    localStorage.setItem('docai_gemini_key', gKey);
    localStorage.setItem('docai_openai_key', oKey);
  };

  const handleModelChange = (model: AIModelId) => {
    setSelectedModel(model);
    localStorage.setItem('docai_model', model);
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Detect OneDrive link inside user text
  useEffect(() => {
    const match = inputPrompt.match(
      /https?:\/\/(?:[a-zA-Z0-9-]+\.)?(?:1drv\.ms|sharepoint\.com|live\.com)[^\s]+/i
    );
    if (match) {
      setDetectedOneDriveUrl(match[0]);
    } else {
      setDetectedOneDriveUrl(null);
    }
  }, [inputPrompt]);

  // Handle direct file upload via API
  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/parse-file', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.attachment) {
          if (file.type.startsWith('image/')) {
            data.attachment.previewUrl = URL.createObjectURL(file);
          }
          setAttachments((prev) => [...prev, data.attachment]);
        } else if (data.error) {
          alert(`Lỗi xử lý file ${file.name}: ${data.error}`);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Không thể tải file lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Global/Local Clipboard Paste (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 1. Image Paste (Snipping tool screenshot)
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            const base64Data = result.split(',')[1];
            const newAttachment: Attachment = {
              id: 'clip-img-' + Date.now(),
              name: `Ảnh chụp màn hình_${new Date().toLocaleTimeString('vi-VN')}.png`,
              type: 'clipboard-image',
              mimeType: file.type,
              size: file.size,
              data: base64Data,
              previewUrl: result,
            };
            setAttachments((prev) => [...prev, newAttachment]);
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }

    // 2. Excel Tabular Paste
    const text = e.clipboardData?.getData('text/plain');
    if (text && text.includes('\t') && text.includes('\n')) {
      const markdownTable = convertExcelToMarkdown(text);
      if (markdownTable) {
        e.preventDefault();
        const rows = text.trim().split('\n').length;
        const newAttachment: Attachment = {
          id: 'clip-table-' + Date.now(),
          name: `Bảng dữ liệu Excel (${rows} dòng)`,
          type: 'clipboard-table',
          mimeType: 'text/markdown',
          extractedText: markdownTable,
        };
        setAttachments((prev) => [...prev, newAttachment]);
        return;
      }
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleFetchDetectedOneDrive = async () => {
    if (!detectedOneDriveUrl) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/onedrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: detectedOneDriveUrl }),
      });
      const data = await res.json();
      if (data.attachment) {
        setAttachments((prev) => [...prev, data.attachment]);
        setInputPrompt((prev) => prev.replace(detectedOneDriveUrl, '').trim());
        setDetectedOneDriveUrl(null);
      } else {
        alert(data.error || 'Lỗi khi tải file OneDrive.');
      }
    } catch {
      alert('Không thể kết nối tải OneDrive.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) return;

    const trimmedPrompt = inputPrompt.trim();
    if (!trimmedPrompt && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: trimmedPrompt,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setAttachments([]);
    setIsStreaming(true);

    const assistantMsgId = 'assistant-' + Date.now();
    const placeholderAssistant: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages([...newMessages, placeholderAssistant]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          model: selectedModel,
          groqApiKey: groqKey || undefined,
          geminiApiKey: geminiKey || undefined,
          openaiApiKey: openaiKey || undefined,
        }),
      });

      if (!response.ok) {
        let errMessage = 'Có lỗi xảy ra khi gọi AI.';
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch {
          errMessage = await response.text();
        }
        throw new Error(errMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Không nhận được luồng phản hồi từ máy chủ.');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
          )
        );
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `⚠️ **Lỗi:** ${(err as Error).message}\n\n*Nếu bạn chưa cài đặt API Key, hãy bấm vào nút **Cài đặt** ở góc trên để nhập Key miễn phí.*`,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex flex-col h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
          handleUploadFiles(e.dataTransfer.files);
        }
      }}
    >
      {/* Sidebar for Chat Sessions */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Header */}
      <Header
        selectedModel={selectedModel}
        onSelectModel={handleModelChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearChat={() => setMessages([])}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        hasMessages={messages.length > 0}
      />

      {/* Main Chat Content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl w-full mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
            <div className="space-y-3 max-w-lg">
              <div className="inline-flex p-3.5 bg-linear-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/25">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Trợ lý DocAI Agent đã sẵn sàng
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Tải lên tài liệu, dán link OneDrive hoặc bấm <b>Ctrl + V</b> để dán trực tiếp bảng Excel/ảnh chụp màn hình. Hỗ trợ tự động xuất báo cáo Excel & Word chỉ với 1 cú click!
              </p>
            </div>

            {/* 3 Input Methods Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-2xl text-left">
              {/* Method 1 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer transition group"
              >
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl w-fit mb-3 group-hover:scale-105 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  1. Kéo thả / Upload File
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  PDF, Excel (.xlsx, .csv), Word (.docx), ảnh scan hóa đơn.
                </p>
              </div>

              {/* Method 2 */}
              <div
                onClick={() => setIsOneDriveOpen(true)}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md cursor-pointer transition group"
              >
                <div className="p-2.5 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-xl w-fit mb-3 group-hover:scale-105 transition">
                  <Cloud className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  2. Link OneDrive
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Dán link chia sẻ OneDrive hoặc SharePoint để AI tải tự động.
                </p>
              </div>

              {/* Method 3 */}
              <div
                onClick={() => textareaRef.current?.focus()}
                className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md cursor-pointer transition group"
              >
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl w-fit mb-3 group-hover:scale-105 transition">
                  <Clipboard className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  3. Dán Clipboard (Ctrl+V)
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Copy ô Excel hoặc ảnh chụp Snipping Tool rồi paste thẳng vào đây.
                </p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Floating Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-40 bg-blue-600/10 backdrop-blur-xs border-4 border-dashed border-blue-500 rounded-3xl m-4 flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
          <Upload className="w-12 h-12 text-blue-600 animate-bounce" />
          <p className="text-base font-semibold text-blue-700 mt-3">
            Thả tệp vào đây để tải lên và phân tích ngay!
          </p>
        </div>
      )}

      {/* Bottom Input Area */}
      <footer className="sticky bottom-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800 p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Detected OneDrive URL Banner */}
          {detectedOneDriveUrl && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-xl text-xs text-sky-800 dark:text-sky-300 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 truncate">
                <Cloud className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="truncate">
                  Phát hiện link OneDrive: <b>{detectedOneDriveUrl}</b>
                </span>
              </div>
              <button
                onClick={handleFetchDetectedOneDrive}
                disabled={isUploading}
                className="shrink-0 ml-3 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {isUploading ? 'Đang tải...' : 'Tải File Này'}
              </button>
            </div>
          )}

          {/* Staged Attachments */}
          {attachments.length > 0 && (
            <div className="px-1">
              <AttachmentList attachments={attachments} onRemove={handleRemoveAttachment} />
            </div>
          )}

          {/* Main Input Box */}
          <div className="relative flex flex-col bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-300/80 dark:border-zinc-700 rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Nhập câu hỏi, kéo thả file vào đây, hoặc nhấn Ctrl + V để dán bảng Excel/ảnh chụp màn hình..."
              className="w-full px-4 pt-3 pb-2 bg-transparent resize-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden"
            />

            {/* Input Action Bar */}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
              {/* Left Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* File Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
                  multiple
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.txt,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition"
                  title="Upload tài liệu (PDF, Excel, Word, Ảnh)"
                >
                  <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Tải tệp</span>
                </button>

                {/* OneDrive Link Button */}
                <button
                  type="button"
                  onClick={() => setIsOneDriveOpen(true)}
                  disabled={isUploading}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/60 rounded-lg transition"
                  title="Nhập link OneDrive hoặc SharePoint"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Link OneDrive</span>
                </button>

                {/* Paste from Clipboard Hint */}
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400 pl-2">
                  <Clipboard className="w-3 h-3" />
                  <span>Dán clipboard: Ctrl + V</span>
                </span>
              </div>

              {/* Right Action: Send Button */}
              <div className="flex items-center gap-2">
                {isUploading && (
                  <span className="flex items-center gap-1.5 text-xs text-blue-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý file...
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={
                    isStreaming ||
                    isUploading ||
                    (!inputPrompt.trim() && attachments.length === 0)
                  }
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  title="Gửi câu hỏi (Enter)"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        groqKey={groqKey}
        geminiKey={geminiKey}
        openaiKey={openaiKey}
        onSave={handleSaveKeys}
      />

      <OneDriveModal
        isOpen={isOneDriveOpen}
        onClose={() => setIsOneDriveOpen(false)}
        onAddAttachment={(att) => setAttachments((prev) => [...prev, att])}
      />
    </div>
  );
}
