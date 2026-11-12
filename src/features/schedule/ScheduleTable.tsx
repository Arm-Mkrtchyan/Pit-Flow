import { useCallback, useMemo } from 'react';
import { Empty, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import type { IsoDate, RowDescriptor } from '../../types/domain';
import { enumerateDays, fromIso } from '../calendar/dateRange';
import { ApplyAllPopover } from './ApplyAllPopover';
import { ROW_DESCRIPTORS } from './rowDescriptors';
import { TargetCell } from './TargetCell';
import { resolveTarget } from './targets';
import styles from './ScheduleTable.module.css';

const DAY_COL_WIDTH = 96;

export function ScheduleTable() {
  const range = useAppStore((s) => s.plan.range);
  const targets = useAppStore((s) => s.plan.targets);
  const setTarget = useAppStore((s) => s.setTarget);
  const applyToAll = useAppStore((s) => s.applyToAll);

  const days = useMemo(() => enumerateDays(range), [range]);

  const onCommit = useCallback(
    (desc: RowDescriptor, date: IsoDate, value: number | null) => setTarget(desc.key, date, value),
    [setTarget],
  );

  const columns = useMemo<ColumnsType<RowDescriptor>>(
    () => [
      {
        key: 'label',
        title: t('schedule.targets'),
        fixed: 'left',
        width: 210,
        render: (_, desc) => (
          <div className={styles.label}>
            <span>
              <Typography.Text strong>{t(desc.labelKey)}</Typography.Text>{' '}
              <Typography.Text type="secondary">({desc.unit})</Typography.Text>{' '}
              {desc.kind === 'limit' && <Tag bordered={false}>{t('row.kind.limit')}</Tag>}
            </span>
            <ApplyAllPopover desc={desc} onApply={(v) => applyToAll(desc.key, v)} />
          </div>
        ),
      },
      ...days.map((date) => {
        const d = fromIso(date);
        const weekend = d.day() === 0 || d.day() === 6;
        const dateLabel = d.format('DD.MM.YYYY');
        return {
          key: date,
          width: DAY_COL_WIDTH,
          align: 'right' as const,
          title: (
            <div className={`${styles.dayHeader} ${weekend ? styles.weekend : ''}`}>
              <span>{d.format('DD.MM')}</span>
              <small>{d.format('ddd')}</small>
            </div>
          ),
          render: (_: unknown, desc: RowDescriptor) => (
            <TargetCell
              desc={desc}
              date={date}
              dateLabel={dateLabel}
              value={resolveTarget(desc, targets, date)}
              overridden={targets[desc.key][date] !== undefined}
              onCommit={onCommit}
            />
          ),
        };
      }),
    ],
    [days, targets, onCommit, applyToAll],
  );

  if (days.length === 0) return <Empty description={t('schedule.empty')} />;

  return (
    <Table<RowDescriptor>
      size="small"
      bordered
      rowKey="key"
      pagination={false}
      dataSource={[...ROW_DESCRIPTORS]}
      columns={columns}
      scroll={{ x: 210 + days.length * DAY_COL_WIDTH }}
      sticky
    />
  );
}
