import { useMemo } from 'react';
import { Descriptions, Drawer, Empty, Table, Tag, Typography } from 'antd';
import { t } from '../../shared/i18n/t';
import { fmtByUnit, fmtDeviation, fmtGrade, fmtTonnes } from '../../shared/format';
import { useAppStore } from '../../store';
import type { Allocation, IsoDate } from '../../types/domain';
import { fromIso } from '../calendar';
import { useStatusColors } from './useStatusColors';
import { INFO_ROWS } from './resultRows';
import { ROW_DESCRIPTORS } from './rowDescriptors';
import { useScheduleResults } from './useScheduleResults';

interface Props {
  date: IsoDate | null;
  onClose: () => void;
}

/** One day's ordered allocation (parents before children) and achieved values with reasons. */
export function DayAllocationDrawer({ date, onClose }: Props) {
  const schedule = useAppStore((s) => s.solution.schedule);
  const blocks = useAppStore((s) => s.blocks);
  const results = useScheduleResults();
  const colors = useStatusColors();
  const byId = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);

  const day = date ? schedule?.days.find((d) => d.date === date) : undefined;
  const result = date ? results?.get(date) : undefined;

  return (
    <Drawer
      open={date !== null}
      onClose={onClose}
      width={560}
      title={date ? t('drawer.title', { date: fromIso(date).format('dddd, DD.MM.YYYY') }) : ''}
    >
      {!day || !result ? (
        <Empty />
      ) : (
        <>
          <Descriptions size="small" bordered column={1} title={t('result.section')}>
            {ROW_DESCRIPTORS.map((desc) => {
              const r = result.rows[desc.key];
              return (
                <Descriptions.Item
                  key={desc.key}
                  label={`${t(desc.labelKey)} (${desc.unit})`}
                  contentStyle={{ background: colors[r.status] }}
                >
                  <div>
                    <strong>{fmtByUnit(r.value, desc.unit)}</strong>{' '}
                    <Typography.Text type="secondary">
                      {desc.kind === 'limit' ? t('drawer.cap') : t('result.target')}{' '}
                      {fmtByUnit(r.target, desc.unit)}
                      {r.deviation !== null && ` · ${fmtDeviation(r.deviation)}`}
                    </Typography.Text>
                  </div>
                  {r.reason && <Typography.Text type="danger">{r.reason}</Typography.Text>}
                </Descriptions.Item>
              );
            })}
            {INFO_ROWS.map((info) => (
              <Descriptions.Item key={info.key} label={`${t(info.labelKey)} (${info.unit})`}>
                {fmtByUnit(result.info[info.key], info.unit)}
              </Descriptions.Item>
            ))}
          </Descriptions>

          <Typography.Title level={5} style={{ marginTop: 20 }}>
            {t('drawer.allocation')}
          </Typography.Title>
          <Typography.Paragraph type="secondary">{t('drawer.orderHint')}</Typography.Paragraph>
          <Table<Allocation>
            size="small"
            rowKey="blockId"
            pagination={false}
            dataSource={day.allocations}
            columns={[
              { title: '#', width: 40, render: (_, __, i) => i + 1 },
              {
                title: t('export.block'),
                dataIndex: 'blockId',
                render: (id: string, a) => (
                  <span>
                    {id} {a.cls === 'waste' && <Tag bordered={false}>{t('class.waste')}</Tag>}
                  </span>
                ),
              },
              {
                title: `${t('drawer.tonnes')} (t)`,
                dataIndex: 'tonnes',
                align: 'right',
                render: (v: number) => fmtTonnes(v),
              },
              {
                title: `${t('field.cu')} %`,
                align: 'right',
                render: (_, a) => fmtGrade(byId.get(a.blockId)?.cu),
              },
              {
                title: `${t('field.mo')} %`,
                align: 'right',
                render: (_, a) => fmtGrade(byId.get(a.blockId)?.mo),
              },
              {
                title: `${t('drawer.endBalance')} (t)`,
                dataIndex: 'endBalance',
                align: 'right',
                render: (v: number) => fmtTonnes(v),
              },
            ]}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  {t('drawer.total')}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  {fmtTonnes(result.oreTonnes + result.wasteTonnes)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={3} />
              </Table.Summary.Row>
            )}
          />
        </>
      )}
    </Drawer>
  );
}
