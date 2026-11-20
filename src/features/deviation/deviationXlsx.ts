import type { Borders, Cell, Fill, Font, PaperSize, Worksheet } from 'exceljs';
import type { IsoDate } from '../../types/domain';
import { t } from '../../shared/i18n/t';
import { fmtPercentInt, fmtSignedInt } from '../../shared/format';
import { fromIso } from '../calendar';
import { downloadBlob } from '../export';
import { categoryView, rowLabelKey, shows, type Execution } from './compute';
import { DEVIATION_CATEGORIES, type DeviationCategory, type DeviationRow } from './types';

/*
 * Excel export of the deviation table, styled after the planners' "Исполнение нарядов по добыче"
 * slide: title, dark-blue group headers (Дата, Блок, three destination groups) over light-blue
 * sub-headers (Наряд, План, Факт, Вып. Наряда, Вып. Плана), bordered data, grey subtotal row per
 * date, yellow «Итого» row; a negative execution is red. Text is in the current UI language.
 */

const COL = { date: 1, block: 2, group0: 3 } as const;
const GROUP_WIDTH = 5;
const ROW = { title: 1, head1: 3, head2: 4, data0: 5 } as const;

const FONT = 'Arial';
const NUM_FMT = '#,##0;-#,##0;"-"';
const HEAD_FILL = 'FF203864';
const SUB_FILL = 'FFD9E1F2';
const SUBTOTAL_FILL = 'FFF2F2F2';
const TOTAL_FILL = 'FFFFE699';
const SECTION_FILL = 'FFDDEBF7';
const RED = 'FFFF0000';
const BLACK = 'FF000000';
const WHITE = 'FFFFFFFF';

const GROUP_KEY: Record<DeviationCategory, `deviation.group.${DeviationCategory}`> = {
  crusher: 'deviation.group.crusher',
  osp: 'deviation.group.osp',
  overburden: 'deviation.group.overburden',
};

const solid = (argb: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const font = (bold: boolean, argb = BLACK, size = 11): Partial<Font> => ({
  name: FONT,
  size,
  bold,
  color: { argb },
});
const center = { horizontal: 'center', vertical: 'middle', wrapText: true } as const;
const right = { horizontal: 'right', vertical: 'middle' } as const;
/** Thin grid, medium line on the left of each group and around the header. */
const border = (leftMedium: boolean): Partial<Borders> => ({
  left: { style: leftMedium ? 'medium' : 'thin' },
  right: { style: 'thin' },
  top: { style: 'thin' },
  bottom: { style: 'thin' },
});

const groupStart = (g: number) => COL.group0 + g * GROUP_WIDTH;
const lastCol = groupStart(DEVIATION_CATEGORIES.length) - 1;
const shortDate = (d: IsoDate) => fromIso(d).format('DD.MM');

export const deviationFileName = (dates: readonly IsoDate[]): string => {
  const from = dates[0];
  const to = dates[dates.length - 1];
  const period = from && to ? `${shortDate(from)}-${shortDate(to)}` : '';
  return `${t('deviation.export.file', { period })}.xlsx`.replace(/[\\/:*?"<>|]/g, ' ');
};

function writeHeader(ws: Worksheet) {
  const head = (cell: Cell, text: string, fill: string, color: string, leftMedium: boolean) => {
    cell.value = text;
    cell.font = font(true, color, 12);
    cell.fill = solid(fill);
    cell.alignment = center;
    cell.border = border(leftMedium);
  };
  ws.mergeCells(ROW.head1, COL.date, ROW.head2, COL.date);
  head(ws.getCell(ROW.head1, COL.date), t('deviation.col.date'), HEAD_FILL, WHITE, true);
  ws.mergeCells(ROW.head1, COL.block, ROW.head2, COL.block);
  head(ws.getCell(ROW.head1, COL.block), t('deviation.col.block'), HEAD_FILL, WHITE, false);
  const subs = [
    t('deviation.sub.order'),
    t('deviation.sub.plan'),
    t('deviation.sub.fact'),
    t('deviation.sub.execOrder'),
    t('deviation.sub.execPlan'),
  ];
  DEVIATION_CATEGORIES.forEach((c, g) => {
    const c0 = groupStart(g);
    ws.mergeCells(ROW.head1, c0, ROW.head1, c0 + GROUP_WIDTH - 1);
    head(ws.getCell(ROW.head1, c0), t(GROUP_KEY[c]), HEAD_FILL, WHITE, true);
    subs.forEach((s, i) => head(ws.getCell(ROW.head2, c0 + i), s, SUB_FILL, BLACK, i === 0));
  });
  ws.getRow(ROW.head1).height = 36;
  ws.getRow(ROW.head2).height = 36;
}

function writeExec(cell: Cell, e: Execution | null, bold: boolean) {
  if (!e) {
    cell.value = '';
    return;
  }
  const diff = fmtSignedInt(e.diff);
  cell.value = e.ratio === null ? diff : `${diff} (${fmtPercentInt(e.ratio)})`;
  cell.font = font(true, e.diff < -0.5 ? RED : BLACK, bold ? 11 : 10);
  cell.alignment = right;
}

function writeRows(ws: Worksheet, rows: readonly DeviationRow[]) {
  let r: number = ROW.data0;
  let dateStart: number = ROW.data0;
  rows.forEach((row, i) => {
    const bold = row.kind !== 'block';
    const fill =
      row.kind === 'total'
        ? TOTAL_FILL
        : row.kind === 'subtotal'
          ? SUBTOTAL_FILL
          : row.kind === 'section'
            ? SECTION_FILL
            : undefined;
    for (let c = COL.date; c <= lastCol; c++) {
      const cell = ws.getCell(r, c);
      const leftMedium =
        c === COL.date || (c >= COL.group0 && (c - COL.group0) % GROUP_WIDTH === 0);
      cell.border = border(leftMedium);
      cell.font = font(bold);
      if (fill) cell.fill = solid(fill);
    }

    if (row.kind === 'total') {
      ws.mergeCells(r, COL.date, r, COL.block);
      ws.getCell(r, COL.date).value = t('deviation.total');
    } else if (row.kind === 'section') {
      // Separator: the section name across the block and all value columns.
      ws.mergeCells(r, COL.block, r, lastCol);
      const cell = ws.getCell(r, COL.block);
      cell.value = t(rowLabelKey(row) ?? 'deviation.section.ore');
      cell.font = font(true, HEAD_FILL, 9);
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      ws.getRow(r).height = 13;
    } else {
      const labelKey = rowLabelKey(row);
      ws.getCell(r, COL.block).value = labelKey ? t(labelKey) : row.block;
    }

    DEVIATION_CATEGORIES.forEach((c, g) => {
      if (!shows(row, c)) return; // the other section's columns stay empty
      const v = categoryView(row, c);
      const c0 = groupStart(g);
      [v.order, v.plan, v.fact].forEach((n, k) => {
        const cell = ws.getCell(r, c0 + k);
        cell.value = n === null ? '—' : Math.round(n);
        cell.numFmt = NUM_FMT;
        cell.alignment = right;
      });
      writeExec(ws.getCell(r, c0 + 3), v.execOrder, bold);
      writeExec(ws.getCell(r, c0 + 4), v.execPlan, bold);
    });

    // Date cell merged over the block rows and the subtotal of its date.
    const next = rows[i + 1];
    if (row.kind !== 'total' && (!next || next.date !== row.date || next.kind === 'total')) {
      if (r > dateStart) ws.mergeCells(dateStart, COL.date, r, COL.date);
      const cell = ws.getCell(dateStart, COL.date);
      cell.value = row.date ? fromIso(row.date).format('DD.MM.YYYY') : '';
      cell.font = font(true);
      cell.alignment = center;
      dateStart = r + 1;
    }
    r++;
  });
}

export async function exportDeviationXlsx(
  rows: readonly DeviationRow[],
  dates: readonly IsoDate[],
  fileName: string,
): Promise<void> {
  const { Workbook } = await import('exceljs');
  const wb = new Workbook();
  const sheetName = t('deviation.export.sheet')
    .replace(/[[\]:*?/\\]/g, ' ')
    .slice(0, 31);
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', xSplit: COL.block, ySplit: ROW.head2 }],
    pageSetup: {
      orientation: 'landscape',
      // A3 is Excel paper code 8, valid in files but missing from ExcelJS's PaperSize enum.
      paperSize: 8 as PaperSize,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  ws.getColumn(COL.date).width = 13;
  ws.getColumn(COL.block).width = 15;
  DEVIATION_CATEGORIES.forEach((_, g) => {
    for (let i = 0; i < GROUP_WIDTH; i++) ws.getColumn(groupStart(g) + i).width = i < 3 ? 11 : 15;
  });

  const from = dates[0];
  const to = dates[dates.length - 1];
  const title = ws.getCell(ROW.title, COL.date);
  title.value = t('deviation.export.title', {
    period: from && to ? `${shortDate(from)} – ${shortDate(to)}` : '',
  });
  title.font = { name: FONT, size: 20, bold: true, color: { argb: HEAD_FILL } };
  ws.getRow(ROW.title).height = 30;

  writeHeader(ws);
  writeRows(ws, rows);

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName,
  );
}
