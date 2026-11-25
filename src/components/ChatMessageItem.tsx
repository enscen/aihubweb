'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import {
  User,
  Copy,
  Check,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Download,
} from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import AttachmentList from './AttachmentList';
import { exportToWord } from '@/lib/export-utils';

interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

/**
 * Interactive table wrapper with 1-click Excel export
 */
function ExportableTable({ children }: { children: React.ReactNode }) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [copied, setCopied] = useState(false);

  const handleExportExcel = () => {
    if (!tableRef.current) return;
    try {
      const workbook = XLSX.utils.table_to_book(tableRef.current, { sheet: 'DuLieu' });
      const filename = `DocAI_Bang_Tinh_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (e) {
      console.error('Export Excel failed:', e);
      alert('Không thể xuất file Excel.');
    }
  };

  const handleCopyCsv = () => {
    if (!tableRef.current) return;
    try {
      const workbook = XLSX.utils.table_to_book(tableRef.current);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(firstSheet);
      navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy CSV failed:', e);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 overflow-hidden shadow-2xs">
      {/* Table Export Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-100/90 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
        <span className="flex items-center gap-1.5 font-medium">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          Bảng dữ liệu
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCsv}
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition text-[11px]"
            title="Sao chép toàn bộ bảng dưới dạng CSV"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Đã chép' : 'Chép CSV'}
          </button>
          <button
            onClick={handleExportExcel}
            type="button"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition text-[11px] shadow-2xs"
            title="Tải bảng này về file Excel (.xlsx)"
          >
            <Download className="w-3 h-3" />
            Xuất Excel (.xlsx)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full text-left text-xs border-collapse">
          {children}
        </table>
      </div>
    </div>
  );
}

export default function ChatMessageItem({ message, isStreaming }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = () => {
    const filename = `DocAI_Bao_Cao_${new Date().toISOString().slice(0, 10)}.doc`;
    exportToWord(message.content, filename);
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
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={handleExportWord}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                title="Tải toàn bộ câu trả lời về file Word (.doc)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất Word</span>
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition"
                title="Sao chép câu trả lời"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
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
              table: ({ children }) => <ExportableTable>{children}</ExportableTable>,
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
