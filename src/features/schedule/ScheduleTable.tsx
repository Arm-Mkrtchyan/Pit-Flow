import { useCallback, useMemo, useState } from 'react';
import { Button, Empty, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { t, unit } from '../../shared/i18n/t';
import { fmtByUnit, fmtTonnes } from '../../shared/format';
import { useAppStore } from '../../store';
import type { BlockClass, BlockId, IsoDate, RowDescriptor, RowUnit } from '../../types/domain';
import { enumerateDays, fromIso } from '../calendar';
import { ApplyAllPopover } from './ApplyAllPopover';
import { DayAllocationDrawer } from './DayAllocationDrawer';
import { ResultCell } from './ResultCell';
import { useStatusColors } from './useStatusColors';
import { INFO_ROWS } from './resultRows';
import { ROW_DESCRIPTORS } from './rowDescriptors';
import { TargetCell } from './TargetCell';
import { resolveTarget } from './targets';
import { useScheduleResults } from './useScheduleResults';
import styles from './ScheduleTable.module.css';

const DAY_COL_WIDTH = 104;
const LABEL_WIDTH = 230;

type TableRow =
  | { kind: 'target'; key: string; desc: RowDescriptor }
  | { kind: 'section'; key: string; label: string; action?: 'alloc' }
  | { kind: 'result'; key: string; desc: RowDescriptor }
  | {
      kind: 'info';
      key: string;
      infoKey: string;
      labelKey: (typeof INFO_ROWS)[number]['labelKey'];
      unit: RowUnit;
    }
  | { kind: 'alloc'; key: string; blockId: BlockId; cls: BlockClass };

export function ScheduleTable() {
  const range = useAppStore((s) => s.plan.range);
  const targets = useAppStore((s) => s.plan.targets);
  const schedule = useAppStore((s) => s.solution.schedule);
  const setTarget = useAppStore((s) => s.setTarget);
  const applyToAll = useAppStore((s) => s.applyToAll);
  const results = useScheduleResults();
  const colors = useStatusColors();
  const [showAlloc, setShowAlloc] = useState(true);
  const [drawerDate, setDrawerDate] = useState<IsoDate | null>(null);

  const days = useMemo(() => enumerateDays(range), [range]);

  // Per block: allocation by date (tonnes + end balance).
  const allocByBlock = useMemo(() => {
    const m = new Map<
      BlockId,
      { cls: BlockClass; byDate: Map<IsoDate, { tonnes: number; end: number }> }
    >();
    for (const d of schedule?.days ?? []) {
      for (const a of d.allocations) {
        const entry = m.get(a.blockId) ?? { cls: a.cls, byDate: new Map() };
        entry.byDate.set(d.date, { tonnes: a.tonnes, end: a.endBalance });
        m.set(a.blockId, entry);
      }
    }
    return m;
  }, [schedule]);

  const rows = useMemo<TableRow[]>(() => {
    const out: TableRow[] = ROW_DESCRIPTORS.map((desc) => ({
      kind: 'target',
      key: `t-${desc.key}`,
      desc,
    }));
    if (!results) return out;
    out.push({ kind: 'section', key: 's-results', label: t('result.section') });
    ROW_DESCRIPTORS.forEach((desc) => out.push({ kind: 'result', key: `r-${desc.key}`, desc }));
    INFO_ROWS.forEach((r) =>
      out.push({ kind: 'info', key: r.key, infoKey: r.key, labelKey: r.labelKey, unit: r.unit }),
    );
    const blocks = [...allocByBlock.entries()].sort(([, a], [, b]) =>
      a.cls === b.cls ? 0 : a.cls === 'ore' ? -1 : 1,
    );
    out.push({
      kind: 'section',
      key: 's-alloc',
      label: t('result.allocation', { count: blocks.length }),
      action: 'alloc',
    });
    if (showAlloc) {
      blocks.forEach(([blockId, v]) =>
        out.push({ kind: 'alloc', key: `a-${blockId}`, blockId, cls: v.cls }),
      );
    }
    return out;
  }, [results, allocByBlock, showAlloc]);

  const onCommit = useCallback(
    (desc: RowDescriptor, date: IsoDate, value: number | null) => setTarget(desc.key, date, value),
    [setTarget],
  );

  const columns = useMemo<ColumnsType<TableRow>>(() => {
    const label: ColumnsType<TableRow>[number] = {
      key: 'label',
      title: t('schedule.targets'),
      fixed: 'left',
      width: LABEL_WIDTH,
      onCell: (row) => (row.kind === 'section' ? { className: styles.section } : {}),
      render: (_, row) => {
        switch (row.kind) {
          case 'target':
            return (
              <div className={styles.label}>
                <span>
                  <Typography.Text strong>{t(row.desc.labelKey)}</Typography.Text>{' '}
                  <Typography.Text type="secondary">({unit(row.desc.unit)})</Typography.Text>{' '}
                  {row.desc.kind === 'limit' && <Tag bordered={false}>{t('row.kind.limit')}</Tag>}
                </span>
                <ApplyAllPopover desc={row.desc} onApply={(v) => applyToAll(row.desc.key, v)} />
              </div>
            );
          case 'section':
            return row.action === 'alloc' ? (
              <Button
                size="small"
                type="text"
                onClick={() => setShowAlloc((v) => !v)}
                aria-expanded={showAlloc}
              >
                {showAlloc ? '▾' : '▸'} {row.label}
              </Button>
            ) : (
              row.label
            );
          case 'result':
            return (
              <span>
                {t('result.achieved', { row: t(row.desc.labelKey) })}{' '}
                <Typography.Text type="secondary">({unit(row.desc.unit)})</Typography.Text>
              </span>
            );
          case 'info':
            return (
              <Typography.Text type="secondary">
                {t(row.labelKey)} ({unit(row.unit)})
              </Typography.Text>
            );
          case 'alloc':
            return (
              <span>
                {row.blockId}{' '}
                {row.cls === 'waste' && (
                  <Tag bordered={false} style={{ marginInlineEnd: 0 }}>
                    {t('class.waste')}
                  </Tag>
                )}
              </span>
            );
        }
      },
    };

    const dayCols: ColumnsType<TableRow> = days.map((date) => {
      const d = fromIso(date);
      const weekend = d.day() === 0 || d.day() === 6;
      const dateLabel = d.format('DD.MM.YYYY');
      const result = results?.get(date);
      const hasDay = result !== undefined;
      return {
        key: date,
        width: DAY_COL_WIDTH,
        align: 'right' as const,
        title: (
          <div
            className={`${styles.dayHeader} ${weekend ? styles.weekend : ''} ${hasDay ? styles.dayButton : ''}`}
            role={hasDay ? 'button' : undefined}
            tabIndex={hasDay ? 0 : undefined}
            aria-label={hasDay ? t('drawer.open', { date: dateLabel }) : undefined}
            onClick={hasDay ? () => setDrawerDate(date) : undefined}
            onKeyDown={
              hasDay
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDrawerDate(date);
                    }
                  }
                : undefined
            }
          >
            <span>{d.format('DD.MM')}</span>
            <small>{d.format('ddd')}</small>
          </div>
        ),
        onCell: (row: TableRow) => {
          if (row.kind === 'section') return { className: styles.section };
          if (row.kind === 'result' && result) {
            return { style: { background: colors[result.rows[row.desc.key].status] } };
          }
          return {};
        },
        render: (_: unknown, row: TableRow) => {
          switch (row.kind) {
            case 'target':
              return (
                <TargetCell
                  desc={row.desc}
                  date={date}
                  dateLabel={dateLabel}
                  value={resolveTarget(row.desc, targets, date)}
                  overridden={targets[row.desc.key][date] !== undefined}
                  onCommit={onCommit}
                />
              );
            case 'result':
              return result ? (
                <ResultCell result={result.rows[row.desc.key]} unit={row.desc.unit} />
              ) : null;
            case 'info':
              return result ? (
                <Typography.Text type="secondary">
                  {fmtByUnit(result.info[row.infoKey], row.unit)}
                </Typography.Text>
              ) : null;
            case 'alloc': {
              const a = allocByBlock.get(row.blockId)?.byDate.get(date);
              return a ? (
                <div className={styles.alloc}>
                  <span>{fmtTonnes(a.tonnes)}</span>
                  <small>{t('result.balance', { value: fmtTonnes(a.end) })}</small>
                </div>
              ) : null;
            }
            case 'section':
              return null;
          }
        },
      };
    });
    return [label, ...dayCols];
  }, [days, targets, results, allocByBlock, colors, onCommit, applyToAll, showAlloc]);

  if (days.length === 0) return <Empty description={t('schedule.empty')} />;

  return (
    <>
      <Table<TableRow>
        size="small"
        bordered
        rowKey="key"
        pagination={false}
        dataSource={rows}
        columns={columns}
        scroll={{ x: LABEL_WIDTH + days.length * DAY_COL_WIDTH }}
        sticky
      />
      <DayAllocationDrawer date={drawerDate} onClose={() => setDrawerDate(null)} />
    </>
  );
}
