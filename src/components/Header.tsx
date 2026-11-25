'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Sparkles,
  Settings as SettingsIcon,
  Trash2,
  ChevronDown,
  LogIn,
  LogOut,
  PanelLeft,
} from 'lucide-react';
import { AIModelId, AVAILABLE_MODELS } from '@/lib/types';

interface HeaderProps {
  selectedModel: AIModelId;
  onSelectModel: (model: AIModelId) => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
  onToggleSidebar?: () => void;
  hasMessages: boolean;
}

export default function Header({
  selectedModel,
  onSelectModel,
  onOpenSettings,
  onClearChat,
  onToggleSidebar,
  hasMessages,
}: HeaderProps) {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Đóng / Mở danh sách đoạn chat"
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
          <Sparkles className="w-4 h-4" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              DocAI Hub
            </h1>
            <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-900">
              Agent Văn Phòng
            </span>
          </div>
        </div>
      </div>

      {/* Model Selector & User Session Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value as AIModelId)}
            className="appearance-none pl-2.5 pr-7 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 rounded-xl text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} {model.provider === 'gemini' ? '★ Miễn phí' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 top-2.5 pointer-events-none" />
        </div>

        {/* Clear Chat */}
        {hasMessages && (
          <button
            onClick={onClearChat}
            title="Làm mới đoạn chat"
            className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Cài đặt API Keys"
          className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 border border-zinc-300/80 dark:border-zinc-700 rounded-xl transition flex items-center gap-1"
        >
          <SettingsIcon className="w-4 h-4 text-zinc-500" />
          <span className="hidden sm:inline">Cài đặt</span>
        </button>

        {/* Google Authentication */}
        {status === 'authenticated' && session?.user ? (
          <div className="flex items-center gap-1.5 pl-1">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-7 h-7 rounded-full border border-blue-500 object-cover"
                title={`${session.user.name} (${session.user.email})`}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                {session.user.name?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={() => signOut()}
              title="Đăng xuất"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('google')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 rounded-xl shadow-2xs transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng nhập</span> Google
          </button>
        )}
      </div>
    </header>
  );
}
