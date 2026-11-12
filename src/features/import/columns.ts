import type { BlockFieldKey } from '../../types/domain';
import type { I18nKey } from '../../shared/i18n/t';
import type { FieldMapping } from './types';

export interface FieldDef {
  key: BlockFieldKey;
  labelKey: I18nKey;
  required: boolean;
  /** Normalised header names that map to this field. First = canonical file header. */
  headers: string[];
}

export const FIELD_DEFS: FieldDef[] = [
  {
    key: 'elevation',
    labelKey: 'field.elevation',
    required: true,
    headers: ['высотная отметка', 'elevation', 'отметка', 'bench'],
  },
  { key: 'group', labelKey: 'field.group', required: true, headers: ['группа', 'group'] },
  {
    key: 'material',
    labelKey: 'field.material',
    required: true,
    headers: ['материал', 'material'],
  },
  { key: 'volume', labelKey: 'field.volume', required: false, headers: ['объем', 'volume'] },
  {
    key: 'weight',
    labelKey: 'field.weight',
    required: true,
    headers: ['масса', 'weight', 'tonnage', 'tonnes'],
  },
  { key: 'cu', labelKey: 'field.cu', required: true, headers: ['cu', 'медь'] },
  { key: 'mo', labelKey: 'field.mo', required: true, headers: ['mo', 'молибден'] },
  { key: 'as', labelKey: 'field.as', required: false, headers: ['as1', 'as'] },
  { key: 'pb', labelKey: 'field.pb', required: false, headers: ['pb'] },
  { key: 'eq', labelKey: 'field.eq', required: true, headers: ['cueq', 'cu_eq', 'cu eq', 'eq'] },
  { key: 'density', labelKey: 'field.density', required: false, headers: ['density', 'плотность'] },
  {
    key: 'site',
    labelKey: 'field.site',
    required: false,
    headers: ['участок', 'site', 'location', 'տեղամաս'],
  },
];

/** Known columns that are deliberately not imported. */
export const IGNORED_HEADERS = ['ox_level'];

export const REQUIRED_FIELDS: BlockFieldKey[] = FIELD_DEFS.filter((f) => f.required).map(
  (f) => f.key,
);

/** Trim, strip BOM, lowercase, collapse whitespace, ё→е. */
export function normalizeHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

/**
 * Map file headers to fields by known names, then fill gaps from the user's last manual mapping.
 * Returns the mapping and any required fields that remain unmapped.
 */
export function autoMapColumns(
  headers: string[],
  lastMapping?: Record<string, BlockFieldKey>,
): { mapping: FieldMapping; missingRequired: BlockFieldKey[] } {
  const normalized = headers.map(normalizeHeader);
  const mapping: FieldMapping = {};
  const used = new Set<number>();

  for (const def of FIELD_DEFS) {
    const idx = normalized.findIndex((h, i) => !used.has(i) && def.headers.includes(h));
    if (idx >= 0) {
      mapping[def.key] = idx;
      used.add(idx);
    }
  }
  if (lastMapping) {
    normalized.forEach((h, i) => {
      const field = lastMapping[h];
      if (field && mapping[field] === undefined && !used.has(i)) {
        mapping[field] = i;
        used.add(i);
      }
    });
  }
  const missingRequired = REQUIRED_FIELDS.filter((k) => mapping[k] === undefined);
  return { mapping, missingRequired };
}

/** Convert a column-index mapping into a header-name mapping for "remember last mapping". */
export function mappingToHeaderMap(
  headers: string[],
  mapping: FieldMapping,
): Record<string, BlockFieldKey> {
  const out: Record<string, BlockFieldKey> = {};
  for (const def of FIELD_DEFS) {
    const idx = mapping[def.key];
    const header = idx !== undefined ? headers[idx] : undefined;
    if (header !== undefined) out[normalizeHeader(header)] = def.key;
  }
  return out;
}
