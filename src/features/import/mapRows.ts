import type { Block, BlockFieldKey } from '../../types/domain';
import { makeBlockId } from '../../shared/utils/ids';
import { parseSiteName, siteBlockId, siteKey } from '../../shared/utils/site';
import { cellToIsoDate } from '../../shared/utils/dates';
import { t } from '../../shared/i18n/t';
import { fmtNumber } from '../../shared/format';
import { createBlockRowSchema, parseNumber, parseString } from './rowSchema';
import type { Cell, FieldMapping, ImportIssue, MappedResult, ParsedFile } from './types';

const DENSITY_TOLERANCE = 0.01;

/**
 * Turn parsed rows into validated blocks. Invalid rows are skipped with a reason;
 * nothing is dropped silently. Duplicate IDs get a `-r<row>` suffix and a warning.
 */
export function mapRows(file: ParsedFile, mapping: FieldMapping): MappedResult {
  const issues: ImportIssue[] = [];
  const blocks: Block[] = [];
  const seen = new Set<string>();
  let totalRows = 0;
  const schema = createBlockRowSchema();

  file.rows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    totalRows++;
    const rowNumber = file.headerRowNumber + 1 + i;
    const cell = (k: BlockFieldKey) => {
      const idx = mapping[k];
      return idx === undefined ? undefined : row[idx];
    };
    const optNum = (k: BlockFieldKey) =>
      mapping[k] === undefined ? undefined : parseNumber(cell(k));

    const parsed = schema.safeParse({
      elevation: parseNumber(cell('elevation')),
      group: parseNumber(cell('group')),
      material: parseString(cell('material')),
      volume: optNum('volume'),
      weight: parseNumber(cell('weight')),
      cu: parseNumber(cell('cu')),
      mo: parseNumber(cell('mo')),
      as: optNum('as'),
      pb: optNum('pb'),
      eq: parseNumber(cell('eq')),
      density: optNum('density'),
      site: mapping.site === undefined ? undefined : parseString(cell('site')),
    });

    if (!parsed.success) {
      const reasons = [...new Set(parsed.error.issues.map((iss) => iss.message))];
      issues.push({ level: 'error', row: rowNumber, message: reasons.join('; ') });
      return;
    }
    const r = parsed.data;

    // With a site (Участок) column the ID comes from it: "location_cn1740_mf_17" + MF → CN1740_MF_17.
    // Otherwise the classic elevation-group-material ID.
    const site = r.site !== undefined ? parseSiteName(r.site) : null;
    if (r.site !== undefined && !site) {
      issues.push({
        level: 'warning',
        row: rowNumber,
        message: t('import.warn.siteUnparsed', { site: r.site }),
      });
    }
    let id = site ? siteBlockId(site, r.material) : makeBlockId(r.elevation, r.group, r.material);
    if (seen.has(id)) {
      const renamed = `${id}-r${rowNumber}`;
      issues.push({
        level: 'warning',
        row: rowNumber,
        message: t('import.warn.duplicateId', { id, renamed }),
      });
      id = renamed;
    }
    seen.add(id);

    if (r.volume !== undefined && r.density !== undefined) {
      const expected = r.volume * r.density;
      const diff = Math.abs(expected - r.weight) / r.weight;
      if (diff > DENSITY_TOLERANCE) {
        issues.push({
          level: 'warning',
          row: rowNumber,
          message: t('import.warn.density', {
            expected: fmtNumber(expected),
            weight: fmtNumber(r.weight),
            diff: (diff * 100).toFixed(1),
          }),
        });
      }
    }

    const mining = readMiningDates(cell('miningStart'), cell('miningEnd'), rowNumber, issues);

    blocks.push({
      id,
      sourceRow: rowNumber,
      ...r,
      ...(site ? { siteKey: siteKey(site) } : {}),
      ...mining,
    });
  });

  return { blocks, issues, totalRows };
}

/**
 * Mining period from the start/end date cells. One date only → a single day. Unreadable dates or
 * end before start → warning, no period.
 */
function readMiningDates(
  startCell: Cell | undefined,
  endCell: Cell | undefined,
  row: number,
  issues: ImportIssue[],
): { miningStart?: string; miningEnd?: string } {
  const read = (c: Cell | undefined): string | null | undefined => {
    if (c === undefined || c === null || String(c).trim() === '') return undefined;
    const iso = cellToIsoDate(c);
    if (!iso) {
      issues.push({
        level: 'warning',
        row,
        message: t('import.warn.badDate', { value: String(c) }),
      });
    }
    return iso;
  };
  const start = read(startCell);
  const end = read(endCell);
  if (start === null || end === null) return {};
  const a = start ?? end;
  const b = end ?? start;
  if (!a || !b) return {};
  if (b < a) {
    issues.push({
      level: 'warning',
      row,
      message: t('import.warn.miningOrder', { start: a, end: b }),
    });
    return {};
  }
  return { miningStart: a, miningEnd: b };
}

export function isBlankRow(row: Cell[]): boolean {
  return row.every((c) => c === null || String(c).trim() === '');
}
