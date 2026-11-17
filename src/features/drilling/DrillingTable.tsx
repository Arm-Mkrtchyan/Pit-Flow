import { useMemo } from 'react';
import { Button, Empty, InputNumber, Select, Table, Tag, theme, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { t, unit } from '../../shared/i18n/t';
import { fmtDays, fmtInt } from '../../shared/format';
import { minutesToClock } from '../../shared/utils/dates';
import { useAppStore } from '../../store';
import { fromIso } from '../calendar';
import type { RowIssue } from './calc';
import { isMiningDay } from './drillBlocks';
import { conflictKey, useDrillingTable, type DrillTableRow } from './useDrillingTable';
import styles from './DrillingTable.module.css';
import { STICKY_HEADER } from '../../shared/layout';

const DAY_COL_WIDTH = 78;
const FIXED_WIDTH = 140 + 100 + 220 + 100 + 95 + 95;

const ISSUE_KEY = {
  noRig: 'drilling.issue.noRig',
  unknownRig: 'drilling.issue.unknownRig',
  noModel: 'drilling.issue.noModel',
  noPosition: 'drilling.issue.noPosition',
} as const satisfies Record<RowIssue, string>;

/** Block cells (name, volume) span all rig rows of the block. */
const spanBlock = (r: DrillTableRow) => ({ rowSpan: r.index === 0 ? r.rowCount : 0 });

export function DrillingTable() {
  const { rows, days, range, rigs, conflicts, hasBlocks } = useDrillingTable();
  const addRigRow = useAppStore((s) => s.addRigRow);
  const removeRigRow = useAppStore((s) => s.removeRigRow);
  const setRowRig = useAppStore((s) => s.setRowRig);
  const setDrilledLm = useAppStore((s) => s.setDrilledLm);
  const toggleStart = useAppStore((s) => s.toggleStart);
  const { token } = theme.useToken();

  const rigOptions = useMemo(
    () => rigs.map((r) => ({ value: r.id, label: r.model ? `${r.name} (${r.model})` : r.name })),
    [rigs],
  );

  const columns = useMemo<ColumnsType<DrillTableRow>>(() => {
    const rangeEnd = range?.[1];
    const fixed: ColumnsType<DrillTableRow> = [
      {
        key: 'block',
        title: t('drilling.col.block'),
        width: 140,
        fixed: 'left',
        onCell: spanBlock,
        render: (_: unknown, r) => {
          const late = r.result.finish && rangeEnd && r.result.finish.date > rangeEnd;
          return (
            <div className={styles.blockCell}>
              <Tooltip
                title={
                  r.block.materials.length > 0
                    ? `${r.block.site} · ${r.block.materials.join(', ')}`
                    : r.block.site
                }
              >
                <Typography.Text strong>{r.block.name}</Typography.Text>
              </Tooltip>
              {r.result.remainingVolume <= 0 && r.block.volume > 0 && (
                <Tag color="success">{t('drilling.done')}</Tag>
              )}
              {late && <Tag color="warning">{t('drilling.afterPeriod')}</Tag>}
              {r.result.unfinished && <Tag color="error">{t('drilling.unfinished')}</Tag>}
              <Button
                size="small"
                type="link"
                style={{ padding: 0 }}
                onClick={() => addRigRow(r.block.key)}
              >
                {t('drilling.addRig')}
              </Button>
            </div>
          );
        },
      },
      {
        key: 'volume',
        title: `${t('drilling.col.volume')}, ${unit('m³')}`,
        width: 100,
        align: 'right',
        fixed: 'left',
        onCell: spanBlock,
        render: (_: unknown, r) => fmtInt(r.block.volume),
      },
      {
        key: 'rig',
        title: t('drilling.col.rig'),
        width: 220,
        fixed: 'left',
        render: (_: unknown, r) => (
          <div className={styles.rigCell}>
            <Select<string>
              size="small"
              style={{ flex: 1, minWidth: 0 }}
              allowClear
              placeholder={rigs.length > 0 ? t('drilling.selectRig') : t('drilling.noEquipment')}
              value={r.row.rigId ?? undefined}
              options={rigOptions}
              status={r.row.issue && r.row.issue !== 'noRig' ? 'warning' : undefined}
              onChange={(v) => setRowRig(r.block.key, r.row.rowId, v ?? null)}
              aria-label={t('drilling.col.rig')}
            />
            {r.row.issue && r.row.issue !== 'noRig' && (
              <Tooltip
                title={t(ISSUE_KEY[r.row.issue], {
                  position: r.block.position.toUpperCase() || '—',
                })}
              >
                <Typography.Text type="warning">⚠</Typography.Text>
              </Tooltip>
            )}
            {r.rowCount > 1 && (
              <Tooltip title={t('drilling.removeRig')}>
                <Button
                  size="small"
                  type="text"
                  danger
                  aria-label={t('drilling.removeRig')}
                  onClick={() => removeRigRow(r.block.key, r.row.rowId)}
                >
                  ×
                </Button>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        key: 'drilled',
        title: `${t('drilling.col.drilled')}, ${unit('lm')}`,
        width: 100,
        align: 'right',
        render: (_: unknown, r) => (
          <InputNumber<number>
            size="small"
            min={0}
            step={10}
            style={{ width: '100%' }}
            value={r.row.drilledLm}
            onChange={(v) => setDrilledLm(r.block.key, r.row.rowId, v ?? 0)}
            aria-label={t('drilling.col.drilled')}
          />
        ),
      },
      {
        key: 'planned',
        title: `${t('drilling.col.planned')}, ${unit('lm')}`,
        width: 95,
        align: 'right',
        render: (_: unknown, r) =>
          r.row.perf ? (
            <Tooltip title={r.row.preview ? t('drilling.previewHint') : undefined}>
              <span className={r.row.preview ? styles.preview : undefined}>
                {fmtInt(r.row.plannedLm)}
              </span>
            </Tooltip>
          ) : (
            '—'
          ),
      },
      {
        key: 'total',
        title: `${t('drilling.col.total')}, ${unit('lm')}`,
        width: 95,
        align: 'right',
        render: (_: unknown, r) => (r.row.perf ? fmtInt(r.row.totalLm) : '—'),
      },
    ];

    const dayCols: ColumnsType<DrillTableRow> = days.map((date) => {
      const d = fromIso(date);
      const weekend = d.day() === 0 || d.day() === 6;
      const dateLabel = d.format('DD.MM.YYYY');
      return {
        key: date,
        width: DAY_COL_WIDTH,
        title: (
          <div className={`${styles.dayHeader} ${weekend ? styles.weekend : ''}`}>
            <span>{d.format('DD.MM')}</span>
            <small>{d.format('ddd')}</small>
          </div>
        ),
        onCell: (r: DrillTableRow) => ({
          className: styles.dayCell,
          style: isMiningDay(r.block, date) ? { background: token.colorSuccessBgHover } : undefined,
          onClick: () => toggleStart(r.block.key, r.row.rowId, date),
          title:
            r.start === date
              ? t('drilling.clearStart', { date: dateLabel })
              : t('drilling.setStart', { date: dateLabel }),
        }),
        render: (_: unknown, r: DrillTableRow) => {
          const lm = r.row.perDay.get(date);
          const conflict = r.row.rigId !== null && conflicts.has(conflictKey(r.row.rigId, date));
          const isStart = r.start === date;
          const blast = r.index === 0 && r.result.blastDay === date;
          if (!lm && !isStart && !blast) return null;
          return (
            <div className={styles.dayInner}>
              {isStart && (
                <span className={styles.start}>
                  ▶ {fmtDays(r.row.durationDays)} {unit('d')}
                </span>
              )}
              {lm !== undefined && lm > 0 && (
                <Tooltip title={conflict ? t('drilling.conflict') : undefined}>
                  <div
                    className={styles.bar}
                    style={{
                      background: conflict ? token.colorErrorBgHover : token.colorPrimaryBgHover,
                    }}
                  >
                    {fmtInt(lm)}
                  </div>
                </Tooltip>
              )}
              {blast && (
                <Tooltip
                  title={
                    r.result.finish
                      ? t('drilling.blastHint', {
                          date: fromIso(r.result.finish.date).format('DD.MM'),
                          time: minutesToClock(r.result.finish.minutes),
                        })
                      : undefined
                  }
                >
                  <Tag color="volcano" style={{ marginInlineEnd: 0 }}>
                    {t('drilling.blast')}
                  </Tag>
                </Tooltip>
              )}
            </div>
          );
        },
      };
    });
    return [...fixed, ...dayCols];
  }, [
    days,
    range,
    rigs.length,
    rigOptions,
    conflicts,
    token,
    addRigRow,
    removeRigRow,
    setRowRig,
    setDrilledLm,
    toggleStart,
  ]);

  if (!hasBlocks) return <Empty description={t('drilling.noBlocks')} />;

  return (
    <Table<DrillTableRow>
      size="small"
      bordered
      rowKey="key"
      pagination={false}
      dataSource={rows}
      columns={columns}
      scroll={{ x: FIXED_WIDTH + days.length * DAY_COL_WIDTH }}
      sticky={STICKY_HEADER}
    />
  );
}
