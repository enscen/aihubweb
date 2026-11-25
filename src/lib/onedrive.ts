/**
 * OneDrive & SharePoint direct download resolver
 */

export interface OneDriveDownloadResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Encodes a OneDrive sharing URL to Microsoft Graph/OneDrive Shares API format
 * Spec: Base64 string encoded, url-safe without padding, prefixed with 'u!'
 */
function encodeSharingUrl(url: string): string {
  const base64 = Buffer.from(url, 'utf-8').toString('base64');
  return (
    'u!' +
    base64
      .replace(/=/g, '')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
  );
}

/**
 * Extracts filename from Content-Disposition header
 */
function extractFilenameFromHeader(header: string | null): string | null {
  if (!header) return null;
  // Match filename*="UTF-8''filename" or filename="filename" or filename=filename
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }
  const match = header.match(/filename=["']?([^"';]+)["']?/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

/**
 * Guess MIME type from filename extension
 */
export function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'csv':
      return 'text/csv';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'doc':
      return 'application/msword';
    case 'txt':
    case 'log':
      return 'text/plain';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Resolves and downloads file from a OneDrive or SharePoint link
 */
export async function downloadFromOneDrive(shareUrl: string): Promise<OneDriveDownloadResult> {
  const trimmedUrl = shareUrl.trim();

  // Strategy 1: For personal OneDrive / 1drv.ms links, try Microsoft Shares API
  if (trimmedUrl.includes('1drv.ms') || trimmedUrl.includes('onedrive.live.com')) {
    try {
      const shareToken = encodeSharingUrl(trimmedUrl);
      const apiUrl = `https://api.onedrive.com/v1.0/shares/${shareToken}/root/content`;
      
      const res = await fetch(apiUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        
        let filename = extractFilenameFromHeader(res.headers.get('content-disposition'));
        if (!filename) {
          filename = 'onedrive_file';
        }
        
        let mimeType = res.headers.get('content-type') || guessMimeType(filename);
        if (mimeType.includes('text/html') && filename !== 'onedrive_file') {
          mimeType = guessMimeType(filename);
        }

        return {
          buffer,
          filename,
          mimeType,
          size: buffer.length,
        };
      }
    } catch (err) {
      console.warn('Shares API failed, falling back to direct URL modification:', err);
    }
  }

  // Strategy 2: URL parameter modification (e.g. ?download=1) for SharePoint & OneDrive
  let targetUrl: URL;
  try {
    targetUrl = new URL(trimmedUrl);
  } catch {
    throw new Error('Link OneDrive không hợp lệ. Vui lòng kiểm tra lại URL.');
  }

  // Force download parameter
  targetUrl.searchParams.set('download', '1');

  const response = await fetch(targetUrl.toString(), {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Không thể tải file từ OneDrive (HTTP ${response.status}). Vui lòng đảm bảo link có quyền xem/tải ("Bất kỳ ai có liên kết").`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html') && !response.headers.get('content-disposition')) {
    throw new Error(
      'Không tải được file trực tiếp (Link trả về trang đăng nhập hoặc xem trước). Vui lòng tạo link chia sẻ có quyền "Anyone with the link can view/download".'
    );
  }

  const arrayBuf = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  let filename = extractFilenameFromHeader(response.headers.get('content-disposition'));
  if (!filename) {
    const pathname = targetUrl.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      filename = decodeURIComponent(lastPart);
    } else {
      filename = 'onedrive_downloaded_file';
    }
  }

  const mimeType = guessMimeType(filename) || contentType || 'application/octet-stream';

  return {
    buffer,
    filename,
    mimeType,
    size: buffer.length,
  };
}
