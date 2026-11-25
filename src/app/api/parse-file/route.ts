import { NextRequest, NextResponse } from 'next/server';
import { parseFileBuffer } from '@/lib/file-parser';
import { Attachment } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file để upload.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parseResult = await parseFileBuffer(buffer, file.name, file.type);

    const attachment: Attachment = {
      id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      name: file.name,
      type: 'file',
      mimeType: parseResult.mimeType,
      size: file.size,
      data: parseResult.dataBase64,
      extractedText: parseResult.extractedText,
    };

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error('File parsing error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Lỗi khi xử lý file tải lên.' },
      { status: 500 }
    );
  }
}
