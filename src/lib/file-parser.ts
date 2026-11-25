import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export interface ParseResult {
  extractedText?: string;
  dataBase64?: string;
  mimeType: string;
  filename: string;
  size: number;
}

/**
 * Parses buffer into text or base64 representation
 */
export async function parseFileBuffer(
  buffer: Buffer,
  filename: string,
  providedMimeType?: string
): Promise<ParseResult> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeType = providedMimeType || guessMimeType(filename);
  const size = buffer.length;

  let extractedText = '';
  let dataBase64 = '';

  // 1. Images
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext) || mimeType.startsWith('image/')) {
    dataBase64 = buffer.toString('base64');
    return {
      filename,
      mimeType,
      size,
      dataBase64,
    };
  }

  // 2. Excel & CSV
  if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetOutputs: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        if (csv.trim()) {
          sheetOutputs.push(`--- Bảng tính (Sheet): ${sheetName} ---\n${csv.trim()}`);
        }
      }

      extractedText = sheetOutputs.join('\n\n') || '[Bảng tính Excel trống]';
    } catch (err) {
      console.error('Error parsing Excel:', err);
      extractedText = `[Không thể đọc file Excel: ${(err as Error).message}]`;
    }

    return {
      filename,
      mimeType,
      size,
      extractedText,
    };
  }

  // 3. Word (.docx)
  if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value.trim();
    } catch (err) {
      console.error('Error parsing docx:', err);
      extractedText = `[Không thể đọc file Word: ${(err as Error).message}]`;
    }

    return {
      filename,
      mimeType,
      size,
      extractedText,
    };
  }

  // 4. PDF
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    dataBase64 = buffer.toString('base64');
    try {
      // Lazy load pdf-parse only if needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule: any = require('pdf-parse');
      if (pdfParseModule?.PDFParse) {
        const parser = new pdfParseModule.PDFParse({ data: buffer });
        const textResult = await parser.getText();
        if (typeof textResult === 'string') {
          extractedText = textResult.trim();
        } else if (textResult?.text) {
          extractedText = textResult.text.trim();
        }
      } else if (typeof pdfParseModule === 'function') {
        const res = await pdfParseModule(buffer);
        extractedText = res.text.trim();
      }
    } catch {
      extractedText = '[Tài liệu PDF được gửi ở định dạng nhị phân nguyên bản để AI phân tích trực quan toàn diện]';
    }

    return {
      filename,
      mimeType,
      size,
      extractedText: extractedText || '[Nội dung PDF được đính kèm trực tiếp]',
      dataBase64,
    };
  }

  // 5. Plain text & Code files
  try {
    extractedText = buffer.toString('utf-8');
  } catch {
    extractedText = '[Tệp nhị phân không thể chuyển thành văn bản]';
  }

  return {
    filename,
    mimeType: mimeType || 'text/plain',
    size,
    extractedText,
  };
}

export function guessMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'xls': return 'application/vnd.ms-excel';
    case 'csv': return 'text/csv';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt': return 'text/plain';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}
