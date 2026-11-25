import * as XLSX from 'xlsx';

/**
 * Parses markdown table text into 2D array
 */
export function parseMarkdownTableToData(mdTable: string): string[][] {
  const lines = mdTable.trim().split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return [];

  const data: string[][] = [];

  for (const line of lines) {
    // Skip separator lines like |---|---|
    if (/^\|[\s-:]+\|$/.test(line.replace(/\|/g, '|').trim()) || line.includes('---')) {
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1) // remove leading and trailing empty items
      .map((c) => c.trim());

    if (cells.length > 0) {
      data.push(cells);
    }
  }

  return data;
}

/**
 * Exports a 2D array or markdown table into an Excel (.xlsx) file and triggers download
 */
export function exportToExcel(dataOrMarkdown: string[][] | string, filename = 'DocAI_Bao_Cao.xlsx') {
  let rows: string[][];

  if (typeof dataOrMarkdown === 'string') {
    rows = parseMarkdownTableToData(dataOrMarkdown);
  } else {
    rows = dataOrMarkdown;
  }

  if (rows.length === 0) {
    alert('Không tìm thấy dữ liệu bảng để xuất file Excel.');
    return;
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = rows[0].map((_, colIdx) => {
    const maxLen = Math.max(...rows.map((row) => (row[colIdx] ? String(row[colIdx]).length : 0)));
    return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DocAI_Data');

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}

/**
 * Exports markdown text into a Word-compatible .doc file and triggers download
 */
export function exportToWord(content: string, filename = 'DocAI_Bao_Cao.doc') {
  // Convert markdown bold/italics/lists to basic HTML for Microsoft Word
  let html = content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  const documentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${filename}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #222; }
        h1 { color: #1a365d; font-size: 18pt; border-bottom: 2px solid #3182ce; padding-bottom: 4px; }
        h2 { color: #2b6cb0; font-size: 14pt; margin-top: 16px; }
        h3 { color: #2d3748; font-size: 12pt; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        th, td { border: 1px solid #cbd5e0; padding: 6px 10px; font-size: 10pt; }
        th { background-color: #edf2f7; color: #1a202c; font-weight: bold; }
        p { margin: 6px 0; }
      </style>
    </head>
    <body>
      <p style="font-size: 9pt; color: #718096; text-align: right;">Được tạo bởi DocAI Hub - ${new Date().toLocaleDateString('vi-VN')}</p>
      <p>${html}</p>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + documentHtml], {
    type: 'application/msword',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
