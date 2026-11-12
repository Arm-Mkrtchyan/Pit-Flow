/** A spreadsheet cell before typing. */
type Cell = string | number | null;

/**
 * Parse a numeric cell. Accepts numbers, "0.259", "0,259" (decimal comma),
 * "1 234,5" / "1,234.5" (thousands separators). Empty → undefined, garbage → NaN.
 */
export function parseNumber(cell: Cell | undefined): number | undefined {
  if (cell === null || cell === undefined) return undefined;
  if (typeof cell === 'number') return cell;
  let s = cell.trim().replace(/[\s\u00a0\u202f]/g, '');
  if (s === '') return undefined;
  if (s.includes(',') && s.includes('.')) {
    // Whichever separator comes last is the decimal separator.
    s =
      s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '');
  } else if (/^-?\d*,\d+$/.test(s)) {
    s = s.replace(',', '.');
  }
  return /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? Number(s) : NaN;
}

export function parseString(cell: Cell | undefined): string | undefined {
  if (cell === null || cell === undefined) return undefined;
  const s = String(cell).trim();
  return s === '' ? undefined : s;
}
