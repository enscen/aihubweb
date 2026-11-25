'use client';

import React, { useState } from 'react';
import { Key, Check, X, ExternalLink, Zap, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groqKey: string;
  geminiKey: string;
  openaiKey: string;
  onSave: (groqKey: string, geminiKey: string, openaiKey: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  groqKey,
  geminiKey,
  openaiKey,
  onSave,
}: SettingsModalProps) {
  const [groqInput, setGroqInput] = useState(groqKey);
  const [geminiInput, setGeminiInput] = useState(geminiKey);
  const [openaiInput, setOpenaiInput] = useState(openaiKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(groqInput.trim(), geminiInput.trim(), openaiInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-950/50 text-orange-600 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Cài đặt API Keys
              </h2>
              <p className="text-xs text-zinc-500">
                Key lưu an toàn trên trình duyệt của bạn, không gửi đi đâu khác.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Groq API Key (Khuyên dùng nhất - 100% Free không cần nạp tiền) */}
          <div className="p-3.5 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/50 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-600" />
                Groq API Key (Llama 3.3 70B)
                <span className="text-[10px] px-2 py-0.5 bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full font-bold uppercase">
                  100% Free • Không cần thẻ
                </span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline flex items-center gap-0.5"
              >
                Lấy key 10s <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="gsk_..."
              value={groqInput}
              onChange={(e) => setGroqInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-zinc-800 border border-orange-300 dark:border-orange-800 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Chỉ cần đăng nhập bằng Google trên trang Groq là có key ngay, không bắt nạp tiền, đọc file và bảng tính cực nhanh.
            </p>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiInput}
              onChange={(e) => setGeminiInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                OpenAI ChatGPT API Key
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                OpenAI Platform <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="sk-..."
              value={openaiInput}
              onChange={(e) => setOpenaiInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" /> Đã lưu!
                </>
              ) : (
                'Lưu Cài Đặt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
