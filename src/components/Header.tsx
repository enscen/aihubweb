'use client';

import React from 'react';
import { Bot, Sparkles, Settings as SettingsIcon, Trash2, ChevronDown } from 'lucide-react';
import { AIModelId, AVAILABLE_MODELS } from '@/lib/types';

interface HeaderProps {
  selectedModel: AIModelId;
  onSelectModel: (model: AIModelId) => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
}

export default function Header({
  selectedModel,
  onSelectModel,
  onOpenSettings,
  onClearChat,
  hasMessages,
}: HeaderProps) {
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              DocAI Hub
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-900">
              Văn Phòng & Tài Liệu
            </span>
          </div>
          <p className="hidden sm:block text-xs text-zinc-500">
            Hỗ trợ File • Link OneDrive • Dán Clipboard Excel/Ảnh
          </p>
        </div>
      </div>

      {/* Model Selector & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value as AIModelId)}
            className="appearance-none pl-3 pr-8 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider === 'gemini' ? 'Google' : 'OpenAI'})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-3 pointer-events-none" />
        </div>

        {/* Clear Chat */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            title="Xóa hội thoại & làm mới"
            className="p-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Cài đặt API Keys"
          className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 border border-zinc-300/80 dark:border-zinc-700 rounded-xl transition"
        >
          <SettingsIcon className="w-4 h-4 text-zinc-500" />
          <span className="hidden sm:inline">Cài đặt API</span>
        </button>
      </div>
    </header>
  );
}
