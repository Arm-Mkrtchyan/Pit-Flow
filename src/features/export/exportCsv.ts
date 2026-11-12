import Papa from 'papaparse';
import { t } from '../../shared/i18n/t';
import type { Sheet } from './scheduleToRows';
import { downloadBlob } from './download';

/** One CSV with the three sheets as sections. UTF-8 with BOM so Excel shows Cyrillic correctly. */
export function exportCsv(
  sheets: { summary: Sheet; allocation: Sheet; balances: Sheet },
  fileName: string,
): void {
  const blank = [[]];
  const rows: Sheet = [
    [t('export.sheet.summary')],
    ...sheets.summary,
    ...blank,
    [t('export.sheet.allocation')],
    ...sheets.allocation,
    ...blank,
    [t('export.sheet.balances')],
    ...sheets.balances,
  ];
  const csv = Papa.unparse(rows, { delimiter: ',', newline: '\r\n' });
  downloadBlob(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }), fileName);
}
