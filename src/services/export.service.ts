import Papa from 'papaparse';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  title?: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(options: ExportOptions) {
  const { filename, headers, rows } = options;
  const csv = Papa.unparse({ fields: headers, data: rows });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export async function exportToExcel(options: ExportOptions) {
  const { filename, headers, rows, title } = options;
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title || 'Report');

  // Add header row
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1A2E' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  // Add data rows
  for (const row of rows) {
    worksheet.addRow(row);
  }

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const length = cell.value ? cell.value.toString().length : 10;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 30);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `${filename}.xlsx`);
}

export async function exportToPDF(options: ExportOptions) {
  const { filename, headers, rows, title } = options;
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? 'landscape' : 'portrait' });

  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }

  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map(String)),
    startY: title ? 30 : 14,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 46], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  });

  doc.save(`${filename}.pdf`);
}

export async function exportData(format: ExportFormat, options: ExportOptions) {
  switch (format) {
    case 'csv':
      exportToCSV(options);
      break;
    case 'excel':
      await exportToExcel(options);
      break;
    case 'pdf':
      await exportToPDF(options);
      break;
  }
}
