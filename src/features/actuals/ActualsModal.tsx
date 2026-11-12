import { useMemo, useState } from 'react';
import { Alert, App, DatePicker, Modal, Space, Table, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { t } from '../../shared/i18n/t';
import { fmtGrade, fmtNumber, fmtTonnes } from '../../shared/format';
import { useAppStore } from '../../store';
import type { IsoDate } from '../../types/domain';
import { fromIso, toIso } from '../calendar';
import { aggregateActuals, applyActuals } from './applyActuals';
import type { ActualMatch, ActualStatus, ParsedActuals } from './types';

const STATUS_COLOR: Record<ActualStatus, string> = {
  applied: 'green',
  overrun: 'orange',
  unmatched: 'default',
  noOre: 'default',
  ambiguous: 'red',
};

interface Props {
  fileName: string;
  parsed: ParsedActuals;
  onClose: () => void;
}

/** Preview and apply actual extraction: choose the cut-off date, review matches, apply (undoable). */
export function ActualsModal({ fileName, parsed, onClose }: Props) {
  const { message } = App.useApp();
  const blocks = useAppStore((s) => s.blocks);
  const inputs = useAppStore((s) => s.userInputs);
  const cutoff = useAppStore((s) => s.settings.oreCutoffEq);
  const planStart = useAppStore((s) => s.plan.range?.[0]);
  const applyResult = useAppStore((s) => s.applyActualsResult);
  const [before, setBefore] = useState<IsoDate>(planStart ?? toIso(dayjs().add(1, 'day')));

  const hasSites = blocks.some((b) => b.siteKey);
  const preview = useMemo(() => {
    const agg = aggregateActuals(parsed.rows, before);
    const result = applyActuals(blocks, inputs, agg.aggregates, before, cutoff);
    return { ...agg, result };
  }, [parsed.rows, before, blocks, inputs, cutoff]);

  const matched = preview.result.matches.filter((m) => m.blocks.length > 0);
  const unmatched = preview.result.matches.filter((m) => m.status === 'unmatched');
  const other = preview.result.matches.filter(
    (m) => m.status === 'noOre' || m.status === 'ambiguous',
  );
  const overruns = matched.filter((m) => m.status === 'overrun').length;
  const unstable = matched.flatMap((m) => m.blocks).filter((b) => b.unstable).length;
  const blocksChanged = matched.reduce((s, m) => s + m.blocks.length, 0);

  const apply = () => {
    const used = matched.map((m) => m.aggregate);
    const first = used.reduce<IsoDate>((d, a) => (a.firstDate < d ? a.firstDate : d), before);
    const last = used.reduce<IsoDate>((d, a) => (a.lastDate > d ? a.lastDate : d), first);
    const entry = applyResult({
      userInputs: preview.result.userInputs,
      before: preview.result.before,
      taken: preview.result.taken,
      beforeInputs: preview.result.beforeInputs,
      range: [first, last],
    });
    if (entry) void message.success(t('actuals.done', { blocks: blocksChanged }));
    onClose();
  };

  return (
    <Modal
      open
      width={920}
      title={t('actuals.title', { name: fileName })}
      okText={t('actuals.apply', { blocks: blocksChanged })}
      okButtonProps={{ disabled: blocksChanged === 0 }}
      cancelText={t('common.cancel')}
      onOk={apply}
      onCancel={onClose}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Typography.Text type="secondary">
          {t('actuals.fileInfo', {
            sheet: parsed.sheetName,
            rows: parsed.rows.length,
            shifts: parsed.shiftCount,
            first: parsed.firstDate ? fromIso(parsed.firstDate).format('DD.MM.YYYY') : '—',
            last: parsed.lastDate ? fromIso(parsed.lastDate).format('DD.MM.YYYY') : '—',
          })}
        </Typography.Text>
        <Space wrap>
          <Typography.Text strong>{t('actuals.before')}</Typography.Text>
          <DatePicker
            allowClear={false}
            format="DD.MM.YYYY"
            value={fromIso(before)}
            onChange={(d: Dayjs | null) => d && setBefore(toIso(d))}
            aria-label={t('actuals.before')}
          />
          <Typography.Text type="secondary">
            {t('actuals.beforeHint', { used: preview.rowsUsed, after: preview.rowsAfter })}
          </Typography.Text>
        </Space>
        <Typography.Text type="secondary">{t('actuals.method')}</Typography.Text>

        {!hasSites && <Alert type="error" showIcon message={t('actuals.noSites')} />}
        {overruns > 0 && (
          <Alert type="warning" showIcon message={t('actuals.overrunWarn', { count: overruns })} />
        )}
        {unstable > 0 && (
          <Alert type="warning" showIcon message={t('actuals.unstableWarn', { count: unstable })} />
        )}

        <Table<ActualMatch>
          size="small"
          rowKey={(m) => m.aggregate.name}
          dataSource={[...matched, ...other]}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          locale={{ emptyText: t('actuals.nothingMatched') }}
          columns={[
            { title: t('actuals.col.name'), render: (_, m) => m.aggregate.name },
            {
              title: t('actuals.col.status'),
              render: (_, m) => (
                <Tag color={STATUS_COLOR[m.status]}>
                  {m.status === 'overrun'
                    ? t('actuals.status.overrun', { tonnes: fmtTonnes(m.overrun) })
                    : m.status === 'ambiguous'
                      ? t('actuals.status.ambiguous', { names: (m.candidates ?? []).join(', ') })
                      : t(`actuals.status.${m.status}`)}
                </Tag>
              ),
            },
            {
              title: t('actuals.col.extracted'),
              align: 'right',
              render: (_, m) =>
                `${fmtTonnes(m.aggregate.tonnes)} (${fmtNumber(m.aggregate.days)} ${t('actuals.days')})`,
            },
            {
              title: t('actuals.col.avg'),
              render: (_, m) =>
                `Cu ${fmtGrade(m.aggregate.grades.cu)} · Mo ${fmtGrade(m.aggregate.grades.mo)}`,
            },
            {
              title: t('actuals.col.result'),
              render: (_, m) => (
                <Space direction="vertical" size={0}>
                  {m.blocks.map((b) => (
                    <span key={b.id}>
                      <strong>{b.id}</strong>: {fmtTonnes(b.remaining)} {t('unit.t')}
                      {b.remaining > 0 && (
                        <>
                          {' · Cu '}
                          {fmtGrade(b.gradesBefore.cu)} → {fmtGrade(b.gradesAfter.cu)}
                          {' · Mo '}
                          {fmtGrade(b.gradesBefore.mo)} → {fmtGrade(b.gradesAfter.mo)}
                        </>
                      )}
                      {b.unstable && (
                        <Tag color="orange" style={{ marginInlineStart: 6 }}>
                          {t('actuals.unstable')}
                        </Tag>
                      )}
                      {b.clampedGrades.length > 0 && (
                        <Tag color="red" style={{ marginInlineStart: 6 }}>
                          {t('actuals.clamped', { grades: b.clampedGrades.join(', ') })}
                        </Tag>
                      )}
                    </span>
                  ))}
                </Space>
              ),
            },
          ]}
        />
        {unmatched.length > 0 && (
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {t('actuals.unmatched', {
              count: unmatched.length,
              names: unmatched.map((m) => m.aggregate.name).join(', '),
            })}
          </Typography.Paragraph>
        )}
      </Space>
    </Modal>
  );
}
