import type { DrillModel } from '../../types/domain';
import { parseNumber, parseString } from '../../shared/utils/numbers';
import type { ParsedFile } from '../import';
import { isBlankRow } from '../import';

/**
 * Flat productivity format (alternative to the approved workbook), one row per model and
 * position (the model is "Модель", or "Название" when there is no model column):
 *   Название | Модель | Позиция | Производительность (п.м./ч) | Индекс взрывания (м³/п.м.) | Часы в сутки
 * Позиция is the pit code from the Участок name (CN, SS, …); empty, "*" or "все" = any position.
 */
type EquipmentField = 'name' | 'model' | 'position' | 'productivity' | 'blastIndex' | 'hours';

const HEADER_PATTERNS: Array<[EquipmentField, RegExp]> = [
  ['blastIndex', /индекс|выход|blast|պայթ/],
  ['productivity', /производ|productiv|արտադր/],
  ['hours', /час|hour|ժամ/],
  ['model', /модел|model|մոդել/],
  ['position', /позиц|position|участ|տեղամաս/],
  ['name', /назв|наимен|станок|оборуд|name|rig|equipment|անվան|սարք/],
];
const REQUIRED: EquipmentField[] = ['name', 'productivity', 'blastIndex'];
const ANY_POSITION = /^(\*|все|всё|all|any|բոլոր)?$/i;

export type EquipmentIssue =
  { kind: 'missingColumns'; fields: EquipmentField[] } | { kind: 'badRow'; row: number };

export interface ParsedEquipment {
  models: DrillModel[];
  issues: EquipmentIssue[];
}

const normHeader = (h: string) =>
  h
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();

export function parseEquipment(file: ParsedFile): ParsedEquipment {
  const cols: Partial<Record<EquipmentField, number>> = {};
  file.headers.forEach((h, i) => {
    const n = normHeader(h);
    const hit = HEADER_PATTERNS.find(([f, re]) => cols[f] === undefined && re.test(n));
    if (hit) cols[hit[0]] = i;
  });
  const missing = REQUIRED.filter((f) => cols[f] === undefined);
  if (missing.length > 0)
    return { models: [], issues: [{ kind: 'missingColumns', fields: missing }] };

  const issues: EquipmentIssue[] = [];
  const byId = new Map<string, DrillModel>();
  file.rows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    const cell = (f: EquipmentField) => {
      const c = cols[f];
      return c === undefined ? undefined : row[c];
    };
    const name = parseString(cell('name'));
    const productivity = parseNumber(cell('productivity'));
    const blastIndex = parseNumber(cell('blastIndex'));
    const hours = parseNumber(cell('hours'));
    if (
      !name ||
      productivity === undefined ||
      !(productivity > 0) ||
      blastIndex === undefined ||
      !(blastIndex > 0)
    ) {
      issues.push({ kind: 'badRow', row: file.headerRowNumber + 1 + i });
      return;
    }
    const modelName = parseString(cell('model')) ?? name;
    const id = modelName.toLowerCase().replace(/\s+/g, ' ');
    const rig = byId.get(id) ?? { id, name: modelName, byPosition: {} };
    if (hours !== undefined && hours > 0 && hours <= 24) rig.hoursPerDay = hours;
    const rawPos = parseString(cell('position')) ?? '';
    const position = ANY_POSITION.test(rawPos) ? '*' : rawPos.toLowerCase();
    rig.byPosition[position] = { blastIndex, productivity };
    byId.set(id, rig);
  });
  return { models: [...byId.values()], issues };
}
