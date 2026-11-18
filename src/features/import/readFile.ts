import { decodeText } from './decode';
import { parseCsvText } from './parseCsv';
import { parseXlsxBuffer } from './parseXlsx';
import type { Grid, ParsedFile } from './types';
import { t } from '../../shared/i18n/t';
import { isBlankRow } from './mapRows';

const XLSX_EXT = /\.(xlsx|xlsm|xls)$/i;

interface ReadResult {
  file: ParsedFile;
  parseErrors: string[];
}

/** Read a CSV/XLSX file into headers + rows. Throws with a user-readable message on failure. */
export async function readBlockFile(fileName: string, buffer: ArrayBuffer): Promise<ReadResult> {
  if (XLSX_EXT.test(fileName)) {
    return toParsedFile(fileName, await parseXlsxBuffer(buffer), { kind: 'xlsx' }, []);
  }
  const { text, encoding } = decodeText(buffer);
  const csv = parseCsvText(text);
  return toParsedFile(
    fileName,
    csv.grid,
    { kind: 'csv', encoding, delimiter: csv.delimiter },
    csv.errors,
  );
}

/**
 * Read text pasted from the clipboard (header row first). Excel and LibreOffice copy cells as
 * tab-separated text, so a tab anywhere means tab-delimited (decimal commas stay inside cells);
 * otherwise it's pasted CSV text and the delimiter is guessed.
 */
export function readBlockText(name: string, text: string): ReadResult {
  const csv = parseCsvText(text, text.includes('\t') ? '\t' : undefined);
  return toParsedFile(name, csv.grid, { kind: 'csv', delimiter: csv.delimiter }, csv.errors);
}

function toParsedFile(
  fileName: string,
  grid: Grid,
  meta: ParsedFile['meta'],
  parseErrors: string[],
): ReadResult {
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
