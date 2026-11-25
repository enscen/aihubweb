'use client';

import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Cloud,
  ClipboardList,
  X,
  File,
} from 'lucide-react';
import { Attachment } from '@/lib/types';

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}

export default function AttachmentList({
  attachments,
  onRemove,
  readOnly = false,
}: AttachmentListProps) {
  if (!attachments || attachments.length === 0) return null;

  const renderIcon = (att: Attachment) => {
    if (att.type === 'onedrive') {
      return <Cloud className="w-4 h-4 text-sky-500" />;
    }
    if (att.type === 'clipboard-table') {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    }
    if (att.type === 'clipboard-image' || att.mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4 text-purple-500" />;
    }
    if (att.type === 'clipboard-text') {
      return <ClipboardList className="w-4 h-4 text-amber-500" />;
    }

    const name = att.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    }
    if (name.endsWith('.pdf')) {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    if (name.endsWith('.docx') || name.endsWith('.doc')) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-zinc-500" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-wrap gap-2 py-1">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="group relative flex items-center gap-2 pl-2.5 pr-2 py-1.5 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 shadow-2xs max-w-xs transition"
        >
          {att.previewUrl || (att.data && att.mimeType.startsWith('image/')) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={att.previewUrl || `data:${att.mimeType};base64,${att.data}`}
              alt={att.name}
              className="w-5 h-5 rounded object-cover"
            />
          ) : (
            renderIcon(att)
          )}

          <div className="flex flex-col min-w-0 pr-1">
            <span className="truncate font-medium">{att.name}</span>
            <span className="text-[10px] text-zinc-400">
              {att.type === 'onedrive'
                ? 'OneDrive link'
                : att.type === 'clipboard-table'
                ? 'Bảng Excel (Clipboard)'
                : att.type === 'clipboard-image'
                ? 'Ảnh chụp (Clipboard)'
                : formatSize(att.size)}
            </span>
          </div>

          {!readOnly && onRemove && (
            <button
              onClick={() => onRemove(att.id)}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md transition"
              title="Xóa đính kèm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
