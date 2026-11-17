import type { Borders, Cell, Fill, Font, PaperSize, Worksheet } from 'exceljs';
import type { DrillRig, IsoDate } from '../../types/domain';
import { t } from '../../shared/i18n/t';
import { fromIso } from '../calendar';
import { downloadBlob } from '../export';
import type { DrillTableRow } from './useDrillingTable';

/*
 * Excel export of the drilling table, styled after the planners' "План бурово-взрывных работ"
 * workbook: title, two header rows (fixed columns + month title over day numbers), one row per
 * rig with metres per day. Block number and volume are merged over the block's rig rows; rig
 * rows are coloured by rig model; the blast day is a pink cell on the block's last row.
 */

// Columns (1-based). Column A is a narrow margin as in the original file.
const COL = { block: 2, volume: 3, rig: 4, drilled: 5, planned: 6, total: 7, day0: 8 } as const;
const ROW = { title: 3, head1: 5, head2: 6, data0: 7 } as const;
const WIDTH = { margin: 3.44, block: 24.89, volume: 27, rig: 33.33, drilled: 19.11 } as const;
const WIDTHS = [WIDTH.margin, WIDTH.block, WIDTH.volume, WIDTH.rig, WIDTH.drilled, 25.89, 20.89];
const DAY_WIDTH = 13.11;

const FONT = 'Calibri';
const NUM_FMT = '#,##0;-#,##0;"-"';
const BLACK = 'FF000000';
// ExcelJS: every cell of a merged range shares the style of its first cell, so a merged range
// gets its border once, on the first cell (writing to the other cells would overwrite it).
/** Rig model colours in order of first appearance (first four as in the original workbook). */
const RIG_COLORS = [
  'FFC00000',
  'FF0070C0',
  'FF7030A0',
  'FF00B050',
  'FFED7D31',
  'FF2F5597',
  'FFBF8F00',
  'FF00B0F0',
];
const BLAST_FILL = 'FFFFCCCC';
const BLAST_FONT = 'FFC00000';

const font = (size: number, argb = BLACK): Partial<Font> => ({
  name: FONT,
  size,
  bold: true,
  color: { argb },
});
const solid = (argb: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const center = { horizontal: 'center', vertical: 'middle', wrapText: true } as const;
type Edge = 'thin' | 'medium' | undefined;
const border = (left: Edge, right: Edge, top: Edge, bottom: Edge): Partial<Borders> => ({
  ...(left ? { left: { style: left } } : {}),
  ...(right ? { right: { style: right } } : {}),
  ...(top ? { top: { style: top } } : {}),
  ...(bottom ? { bottom: { style: bottom } } : {}),
});

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const monthLabel = (date: IsoDate) => {
  const d = fromIso(date);
  return t('drilling.export.month', {
    month: capitalize(d.format('MMMM')),
    year: d.format('YYYY'),
  });
};
const round = (v: number) => Math.round(v);

const rigLabel = (rig: DrillRig | undefined, rigId: string | null) =>
  rig ? (rig.model ? `${rig.name} (${rig.model})` : rig.name) : (rigId ?? '');

/** Title period: the month if the horizon lies in one month, else the date range. */
function periodLabel(days: readonly IsoDate[]): string {
  const first = days[0];
  const last = days.at(-1);
  if (first === undefined || last === undefined) return '';
  if (first.slice(0, 7) === last.slice(0, 7)) return monthLabel(first);
  return `${fromIso(first).format('DD.MM.YYYY')} – ${fromIso(last).format('DD.MM.YYYY')}`;
}

function writeHeader(ws: Worksheet, days: readonly IsoDate[]) {
  const fixed: Array<[number, string]> = [
    [COL.block, t('drilling.export.block')],
    [COL.volume, t('drilling.export.volume')],
    [COL.rig, t('drilling.export.rig')],
    [COL.drilled, t('drilling.export.drilled')],
    [COL.planned, t('drilling.export.planned')],
    [COL.total, t('drilling.export.total')],
  ];
  for (const [c, label] of fixed) {
    ws.mergeCells(ROW.head1, c, ROW.head2, c);
    const cell = ws.getCell(ROW.head1, c);
    cell.value = label;
    cell.font = font(16);
    cell.alignment = center;
    cell.border = border('medium', 'medium', 'medium', 'medium');
  }

  // Month titles over their day columns, day numbers below.
  let start = 0;
  days.forEach((date, i) => {
    const next = days[i + 1];
    if (next !== undefined && next.slice(0, 7) === date.slice(0, 7)) return;
    const c0 = COL.day0 + start;
    const c1 = COL.day0 + i;
    if (c1 > c0) ws.mergeCells(ROW.head1, c0, ROW.head1, c1);
    const cell = ws.getCell(ROW.head1, c0);
    cell.value = monthLabel(date);
    cell.font = font(18);
    cell.alignment = center;
    cell.border = border('medium', 'medium', 'medium', 'medium');
    start = i + 1;
  });
  days.forEach((date, i) => {
    const cell = ws.getCell(ROW.head2, COL.day0 + i);
    cell.value = fromIso(date).date();
    cell.font = font(16);
    cell.alignment = center;
    cell.border = border(
      i === 0 ? 'medium' : 'thin',
      i === days.length - 1 ? 'medium' : 'thin',
      'medium',
      'medium',
    );
  });
  ws.getRow(ROW.head1).height = 36;
  ws.getRow(ROW.head2).height = 42.9;
}

function writeRows(
  ws: Worksheet,
  rows: readonly DrillTableRow[],
  days: readonly IsoDate[],
  rigsById: ReadonlyMap<string, DrillRig>,
) {
  const colorOf = new Map<string, string>();
  const rigColor = (rig: DrillRig | undefined) => {
    if (!rig) return BLACK;
    const key = (rig.model ?? rig.name).trim().toLowerCase();
    let color = colorOf.get(key);
    if (color === undefined) {
      color = RIG_COLORS[colorOf.size % RIG_COLORS.length] ?? BLACK;
      colorOf.set(key, color);
    }
    return color;
  };
  const lastCol = COL.day0 + days.length - 1;

  rows.forEach((r, i) => {
    const rowNo = ROW.data0 + i;
    const isFirst = r.index === 0;
    const isLast = r.index === r.rowCount - 1;
    const bottom: Edge = isLast ? 'medium' : 'thin';
    const rig = r.row.rigId !== null ? rigsById.get(r.row.rigId) : undefined;
    const color = rigColor(rig);
    ws.getRow(rowNo).height = 21.75;

    const put = (c: number, value: Cell['value'], argb: string, b: Partial<Borders>) => {
      const cell = ws.getCell(rowNo, c);
      cell.value = value;
      cell.font = font(16, argb);
      cell.alignment = center;
      cell.border = b;
      if (typeof value === 'number') cell.numFmt = NUM_FMT;
    };

    if (isFirst) {
      if (r.rowCount > 1) {
        ws.mergeCells(rowNo, COL.block, rowNo + r.rowCount - 1, COL.block);
        ws.mergeCells(rowNo, COL.volume, rowNo + r.rowCount - 1, COL.volume);
      }
      put(COL.block, r.block.name, BLACK, border('medium', 'medium', 'medium', 'medium'));
      put(COL.volume, round(r.block.volume), BLACK, border('medium', 'medium', 'medium', 'medium'));
    }
    const side = border('medium', 'medium', 'thin', bottom);
    put(COL.rig, rigLabel(rig, r.row.rigId), color, side);
    put(COL.drilled, round(r.row.drilledLm), color, side);
    put(COL.planned, r.row.perf ? round(r.row.plannedLm) : null, color, side);
    put(COL.total, r.row.perf ? round(r.row.totalLm) : null, color, side);

    days.forEach((date, d) => {
      const c = COL.day0 + d;
      const lm = r.row.perDay.get(date);
      const metres = lm !== undefined && lm > 0 ? round(lm) : null;
      const blast = isLast && r.result.blastDay === date;
      put(
        c,
        blast && metres === null ? t('drilling.export.blast') : metres,
        blast ? BLAST_FONT : color,
        border('thin', c === lastCol ? 'medium' : 'thin', 'thin', bottom),
      );
      if (blast) {
        const cell = ws.getCell(rowNo, c);
        cell.fill = solid(BLAST_FILL);
        if (metres !== null) cell.note = t('drilling.export.blast');
      }
    });
  });
}

/** Build the styled workbook and download it. ExcelJS is loaded only when exporting. */
export async function exportDrillingXlsx(
  rows: readonly DrillTableRow[],
  days: readonly IsoDate[],
  rigsById: ReadonlyMap<string, DrillRig>,
  fileName: string,
): Promise<void> {
  const { Workbook } = await import('exceljs');
  const wb = new Workbook();
  const sheetName = t('drilling.export.sheet')
    .replace(/[[\]:*?/\\]/g, ' ')
    .slice(0, 31);
  const ws = wb.addWorksheet(sheetName, {
    views: [{ zoomScale: 55, zoomScaleNormal: 55 }],
    pageSetup: {
      orientation: 'landscape',
      // A3 is Excel paper code 8, valid in files but missing from ExcelJS's PaperSize enum.
      paperSize: 8 as PaperSize,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 1.3, right: 0.71, top: 0.75, bottom: 0.75, header: 0.31, footer: 0.31 },
    },
  });
  ws.properties.defaultRowHeight = 21;

  WIDTHS.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  days.forEach((_, i) => (ws.getColumn(COL.day0 + i).width = DAY_WIDTH));

  const title = ws.getCell(ROW.title, COL.block);
  title.value = t('drilling.export.title', { period: periodLabel(days) });
  title.font = font(28);
  ws.getRow(ROW.title).height = 36.6;

  writeHeader(ws, days);
  writeRows(ws, rows, days, rigsById);

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}

export const drillingFileName = (range: readonly [IsoDate, IsoDate] | null): string =>
  range ? `pitflow-drilling_${range[0]}_${range[1]}.xlsx` : 'pitflow-drilling.xlsx';
