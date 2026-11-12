import { decodeText } from './decode';
import { parseCsvText } from './parseCsv';
import { parseXlsxBuffer } from './parseXlsx';
import type { Grid, ParsedFile } from './types';
import { t } from '../../shared/i18n/t';
import { isBlankRow } from './mapRows';

const XLSX_EXT = /\.(xlsx|xlsm|xls)$/i;

/** Read a CSV/XLSX file into headers + rows. Throws with a user-readable message on failure. */
export async function readBlockFile(
  fileName: string,
  buffer: ArrayBuffer,
): Promise<{ file: ParsedFile; parseErrors: string[] }> {
  let grid: Grid;
  let meta: ParsedFile['meta'];
  let parseErrors: string[] = [];

  if (XLSX_EXT.test(fileName)) {
    grid = await parseXlsxBuffer(buffer);
    meta = { kind: 'xlsx' };
  } else {
    const { text, encoding } = decodeText(buffer);
    const csv = parseCsvText(text);
    grid = csv.grid;
    parseErrors = csv.errors;
    meta = { kind: 'csv', encoding, delimiter: csv.delimiter };
  }

  const headerIdx = grid.findIndex((row) => !isBlankRow(row));
  const headerRow = headerIdx >= 0 ? grid[headerIdx] : undefined;
  if (!headerRow) throw new Error(t('import.empty'));

  return {
    file: {
      fileName,
      headers: headerRow.map((c) => (c === null ? '' : String(c).trim())),
      rows: grid.slice(headerIdx + 1),
      headerRowNumber: headerIdx + 1,
      meta,
    },
    parseErrors,
  };
}
