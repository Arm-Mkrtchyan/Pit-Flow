import { t } from '../../shared/i18n/t';
import type { Sheet } from './scheduleToRows';
import { downloadBlob } from './download';

/** Workbook with Summary, Allocation and Balances sheets. SheetJS is loaded lazily. */
export async function exportXlsx(
  sheets: { summary: Sheet; allocation: Sheet; balances: Sheet },
  fileName: string,
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const add = (data: Sheet, name: string) => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 34 }, { wch: 8 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add(sheets.summary, t('export.sheet.summary'));
  add(sheets.allocation, t('export.sheet.allocation'));
  add(sheets.balances, t('export.sheet.balances'));
  const out: ArrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    fileName,
  );
}
