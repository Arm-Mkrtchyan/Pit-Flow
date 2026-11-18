import { locationKey, parseLocation } from '../drilling';
import { decodeText } from '../import';

/*
 * Resource file (e.g. resurs1.csv): no header, comma-delimited, one row per location and
 * resource:
 *   yes,location_ss1890_mf_48,resource_1,MAX_RATE,77214,,0,,
 * Column 2 is the location, column 3 the resource, column 5 the value. Only the "resource_1"
 * rows (one per location, the block's exported ore) are updated with the actual total; every
 * other byte of the file is written back unchanged.
 */

const COL = { location: 1, resource: 2, value: 4 } as const;
const RESOURCE_ROW = 'resource_1';

export interface ResourceFile {
  /** Text without BOM. */
  text: string;
  encoding: 'utf-8' | 'windows-1251';
  bom: boolean;
}

export function readResourceFile(buffer: ArrayBuffer): ResourceFile {
  const b = new Uint8Array(buffer);
  const bom = b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf;
  return { ...decodeText(buffer), bom };
}

/** Encode back to the file's own encoding (and BOM), so unchanged lines stay byte-identical. */
export function encodeResourceFile(file: ResourceFile, text: string): Uint8Array<ArrayBuffer> {
  if (file.encoding === 'utf-8') {
    const body = new TextEncoder().encode(text);
    if (!file.bom) return body;
    const out = new Uint8Array(body.length + 3);
    out.set([0xef, 0xbb, 0xbf]);
    out.set(body, 3);
    return out;
  }
  // Windows-1251 is a single-byte encoding: invert its decoding table.
  const decoder = new TextDecoder('windows-1251');
  const toByte = new Map<string, number>();
  for (let i = 0; i < 256; i++) toByte.set(decoder.decode(new Uint8Array([i])), i);
  return Uint8Array.from(text, (ch) => toByte.get(ch) ?? 0x3f);
}

/** Split one CSV line into raw fields (quotes kept), so a field can be swapped in place. */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    if (ch === ',' && !quoted) {
      fields.push(cur);
      cur = '';
    } else cur += ch;
  }
  fields.push(cur);
  return fields;
}

const unquote = (f: string) =>
  f
    .trim()
    .replace(/^"(.*)"$/s, '$1')
    .replace(/""/g, '"');

export type ResourceStatus = 'updated' | 'same' | 'notFound' | 'noBlockNumber';

export interface ResourceRowResult {
  /** 1-based line number. */
  line: number;
  location: string;
  /** Block key ("cn1740-24"); null when the location has no block number. */
  key: string | null;
  oldValue: number | null;
  /** Actual exported tonnes (unrounded); null when the block has no actual rows. */
  actual: number | null;
  newValue: number | null;
  status: ResourceStatus;
}

/** Write the actual totals into column 5 of the resource_1 rows; other lines are untouched. */
export function updateResourceCsv(
  text: string,
  totals: ReadonlyMap<string, number>,
): { text: string; rows: ResourceRowResult[] } {
  const rows: ResourceRowResult[] = [];
  // Split keeping each line's terminator, so line endings are preserved exactly.
  const parts = text.split(/(\r\n|\n|\r)/);
  for (let i = 0; i < parts.length; i += 2) {
    const line = parts[i] ?? '';
    const fields = splitCsvLine(line);
    if (unquote(fields[COL.resource] ?? '').toLowerCase() !== RESOURCE_ROW) continue;
    const location = unquote(fields[COL.location] ?? '');
    const raw = unquote(fields[COL.value] ?? '');
    const oldValue = raw === '' || !Number.isFinite(Number(raw)) ? null : Number(raw);
    const base = { line: i / 2 + 1, location, oldValue };
    if (!parseLocation(location)) {
      rows.push({ ...base, key: null, actual: null, newValue: oldValue, status: 'noBlockNumber' });
      continue;
    }
    const key = locationKey(location);
    const actual = totals.get(key);
    if (actual === undefined) {
      rows.push({ ...base, key, actual: null, newValue: oldValue, status: 'notFound' });
      continue;
    }
    const newValue = Math.round(actual);
    if (newValue === oldValue) {
      rows.push({ ...base, key, actual, newValue, status: 'same' });
      continue;
    }
    fields[COL.value] = String(newValue);
    parts[i] = fields.join(',');
    rows.push({ ...base, key, actual, newValue, status: 'updated' });
  }
  return { text: parts.join(''), rows };
}
