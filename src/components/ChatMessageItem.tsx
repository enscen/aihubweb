'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import AttachmentList from './AttachmentList';

interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export default function ChatMessageItem({ message, isStreaming }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex gap-3.5 py-4 px-4 sm:px-6 rounded-2xl transition ${
        isAssistant
          ? 'bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/40'
          : 'bg-white dark:bg-zinc-950'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
            {isAssistant ? 'DocAI Trợ Lý' : 'Bạn'}
          </span>

          {isAssistant && message.content && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition"
              title="Sao chép câu trả lời"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Display attachments if message has them */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="pb-1">
            <AttachmentList attachments={message.attachments} readOnly />
          </div>
        )}

        {/* Message body */}
        <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-relaxed break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ ...props }) => (
                <div className="my-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs border-collapse" {...props} />
                </div>
              ),
              thead: ({ ...props }) => (
                <thead className="bg-zinc-100 dark:bg-zinc-800/80 font-semibold text-zinc-900 dark:text-zinc-100" {...props} />
              ),
              th: ({ ...props }) => (
                <th className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 font-medium" {...props} />
              ),
              td: ({ ...props }) => (
                <td className="p-2.5 border-b border-zinc-100 dark:border-zinc-800/60" {...props} />
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-mono text-xs" {...props}>
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="p-3 my-3 rounded-xl bg-zinc-900 text-zinc-100 overflow-x-auto font-mono text-xs">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
