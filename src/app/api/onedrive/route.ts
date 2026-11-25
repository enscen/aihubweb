import { NextRequest, NextResponse } from 'next/server';
import { downloadFromOneDrive } from '@/lib/onedrive';
import { parseFileBuffer } from '@/lib/file-parser';
import { Attachment } from '@/lib/types';

export const maxDuration = 60; // Allow up to 60s for larger file downloads

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Vui lòng cung cấp link OneDrive hợp lệ.' }, { status: 400 });
    }

    // 1. Download file from OneDrive link
    const downloadResult = await downloadFromOneDrive(url);

    // 2. Parse file into text / base64
    const parseResult = await parseFileBuffer(
      downloadResult.buffer,
      downloadResult.filename,
      downloadResult.mimeType
    );

    const attachment: Attachment = {
      id: 'onedrive-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: parseResult.filename,
      type: 'onedrive',
      mimeType: parseResult.mimeType,
      size: parseResult.size,
      data: parseResult.dataBase64,
      extractedText: parseResult.extractedText,
      originalUrl: url,
    };

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error('OneDrive download error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Lỗi khi tải file từ OneDrive.' },
      { status: 500 }
    );
  }
}
