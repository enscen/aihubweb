'use client';

import React, { useState } from 'react';
import { Cloud, Link as LinkIcon, Loader2, X, AlertCircle } from 'lucide-react';
import { Attachment } from '@/lib/types';

interface OneDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAttachment: (attachment: Attachment) => void;
}

export default function OneDriveModal({
  isOpen,
  onClose,
  onAddAttachment,
}: OneDriveModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/onedrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể tải file từ link OneDrive này.');
      }

      if (data.attachment) {
        onAddAttachment(data.attachment);
        setUrl('');
        onClose();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Nhập Link OneDrive / SharePoint
              </h2>
              <p className="text-xs text-zinc-500">
                Tự động tải nội dung file và đưa vào ngữ cảnh xử lý của AI.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Đường dẫn chia sẻ (Share URL)
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://1drv.ms/u/... hoặc https://company.sharepoint.com/:x:/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                required
                className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <LinkIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
            <p className="text-xs text-zinc-500">
              Hỗ trợ link từ OneDrive cá nhân hoặc SharePoint công ty (chọn quyền <i>&quot;Bất kỳ ai có liên kết xem được&quot;</i>).
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-5 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải file...
                </>
              ) : (
                'Tải & Đính Kèm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
