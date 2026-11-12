import type { Cell, Grid } from './types';

/**
 * Parse the first sheet of an .xlsx/.xls workbook. SheetJS is loaded lazily (large).
 * Blank rows are kept so that grid index + 1 equals the Excel row number.
 */
export async function parseXlsxBuffer(buffer: ArrayBuffer): Promise<Grid> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstName = wb.SheetNames[0];
  const ws = firstName !== undefined ? wb.Sheets[firstName] : undefined;
  if (!ws?.['!ref']) return [];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });
  // sheet_to_json starts at the first row of the used range; pad rows above it.
  const startRow = XLSX.utils.decode_range(ws['!ref']).s.r;
  const pad: Grid = Array.from({ length: startRow }, () => []);
  return [...pad, ...raw.map((row) => row.map(toCell))];
}

function toCell(v: unknown): Cell {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}
