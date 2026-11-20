import { useMemo } from 'react';
import { Button, Card, Col, Empty, Row, Space, Table, Typography, Upload, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { t } from '../../shared/i18n/t';
import { fmtInt, fmtPercentInt, fmtSignedInt } from '../../shared/format';
import { STICKY_HEADER } from '../../shared/layout';
import { fromIso } from '../calendar';
import { categoryView, rowLabelKey, shows, type Execution } from './compute';
import { DEVIATION_CATEGORIES, type DeviationCategory, type DeviationRow } from './types';
import { useDeviation } from './useDeviation';
import styles from './DeviationPanel.module.css';

const fmtDate = (d: string) => fromIso(d).format('DD.MM.YYYY');
/** Zero tonnes are shown as "-", like the planners' report. */
const tonnes = (v: number | null) => (v === null ? '—' : Math.round(v) === 0 ? '-' : fmtInt(v));

const GROUP_KEY: Record<DeviationCategory, `deviation.group.${DeviationCategory}`> = {
  crusher: 'deviation.group.crusher',
  osp: 'deviation.group.osp',
  overburden: 'deviation.group.overburden',
};

function ExecCell({ e, danger }: { e: Execution | null; danger: string }) {
  if (!e) return null;
  const color = e.diff < -0.5 ? danger : undefined;
  return (
    <div style={{ lineHeight: 1.25, color, fontWeight: 600 }}>
      <div>{fmtSignedInt(e.diff)}</div>
      {e.ratio !== null && <small>{fmtPercentInt(e.ratio)}</small>}
    </div>
  );
}

/** Deviation calculation: weekly plan + plan/actual workbook → order / plan / actual by block. */
export function DeviationPanel() {
  const { plan, actuals, loading, loadPlan, loadActuals, rows, download } = useDeviation();
  const { token } = theme.useToken();

  // Date cell spans the block rows and the subtotal of its date.
  const dateSpan = useMemo(() => {
    const span = new Map<string, number>();
    if (!rows) return span;
    let i = 0;
    while (i < rows.length) {
      const r = rows[i];
      if (!r || r.kind === 'total') break;
      let j = i;
      while (j < rows.length && rows[j]?.date === r.date && rows[j]?.kind !== 'total') j++;
      span.set(r.key, j - i);
      for (let k = i + 1; k < j; k++) span.set(rows[k]?.key ?? '', 0);
      i = j;
    }
    return span;
  }, [rows]);

  const columns = useMemo<ColumnsType<DeviationRow>>(() => {
    const groups = DEVIATION_CATEGORIES.map((c) => ({
      key: c,
      title: t(GROUP_KEY[c]),
      children: [
        {
          key: `${c}-order`,
          title: t('deviation.sub.order'),
          width: 92,
          align: 'right' as const,
          render: (_: unknown, r: DeviationRow) =>
            shows(r, c) ? tonnes(categoryView(r, c).order) : null,
        },
        {
          key: `${c}-plan`,
          title: t('deviation.sub.plan'),
          width: 92,
          align: 'right' as const,
          render: (_: unknown, r: DeviationRow) =>
            shows(r, c) ? tonnes(categoryView(r, c).plan) : null,
        },
        {
          key: `${c}-fact`,
          title: t('deviation.sub.fact'),
          width: 92,
          align: 'right' as const,
          render: (_: unknown, r: DeviationRow) =>
            shows(r, c) ? tonnes(categoryView(r, c).fact) : null,
        },
        {
          key: `${c}-execOrder`,
          title: t('deviation.sub.execOrder'),
          width: 96,
          align: 'right' as const,
          render: (_: unknown, r: DeviationRow) =>
            shows(r, c) ? (
              <ExecCell e={categoryView(r, c).execOrder} danger={token.colorError} />
            ) : null,
        },
        {
          key: `${c}-execPlan`,
          title: t('deviation.sub.execPlan'),
          width: 96,
          align: 'right' as const,
          render: (_: unknown, r: DeviationRow) =>
            shows(r, c) ? (
              <ExecCell e={categoryView(r, c).execPlan} danger={token.colorError} />
            ) : null,
        },
      ],
    }));
    return [
      {
        key: 'date',
        title: t('deviation.col.date'),
        width: 110,
        fixed: 'left',
        onCell: (r) =>
          r.kind === 'total' ? { colSpan: 2 } : { rowSpan: dateSpan.get(r.key) ?? 1 },
        render: (_, r) =>
          r.kind === 'total' ? t('deviation.total') : r.date ? fmtDate(r.date) : '',
      },
      {
        key: 'block',
        title: t('deviation.col.block'),
        width: 120,
        fixed: 'left',
        onCell: (r) => (r.kind === 'total' ? { colSpan: 0 } : {}),
        render: (_, r) => {
          const key = rowLabelKey(r);
          return key ? t(key) : r.block;
        },
      },
      ...groups,
    ];
  }, [dateSpan, token.colorError]);

  const summary = (dates: readonly string[]) =>
    dates.length > 0
      ? `${fmtDate(dates[0] ?? '')} – ${fmtDate(dates[dates.length - 1] ?? '')}`
      : '—';

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title={t('deviation.plan.title')} style={{ height: '100%' }}>
            <Typography.Paragraph type="secondary">{t('deviation.plan.hint')}</Typography.Paragraph>
            <Upload
              accept=".xlsx,.xlsm,.xls"
              showUploadList={false}
              beforeUpload={(f) => {
                void loadPlan(f);
                return false;
              }}
            >
              <Button type="primary" loading={loading === 'plan'}>
                {t('deviation.plan.upload')}
              </Button>
            </Upload>
            {plan && (
              <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                <Typography.Text strong>{plan.name}</Typography.Text>
                <br />
                {t('deviation.plan.summary', {
                  period: summary(plan.parsed.dates),
                  blocks: new Set(plan.parsed.entries.map((e) => e.key)).size,
                })}
              </Typography.Paragraph>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title={t('deviation.actuals.title')} style={{ height: '100%' }}>
            <Typography.Paragraph type="secondary">
              {t('deviation.actuals.hint')}
            </Typography.Paragraph>
            <Upload
              accept=".xlsx,.xlsm,.xls"
              showUploadList={false}
              beforeUpload={(f) => {
                void loadActuals(f);
                return false;
              }}
            >
              <Button type="primary" loading={loading === 'actuals'}>
                {t('deviation.actuals.upload')}
              </Button>
            </Upload>
            {actuals && (
              <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                <Typography.Text strong>{actuals.name}</Typography.Text>
                <br />
                {t('deviation.actuals.summary', {
                  period: summary(actuals.parsed.factDates),
                })}
              </Typography.Paragraph>
            )}
          </Card>
        </Col>
      </Row>

      {!rows ? (
        <Empty description={t('deviation.needBoth')} />
      ) : (
        <>
          <Space wrap>
            <Button type="primary" loading={loading === 'export'} onClick={() => void download()}>
              {t('deviation.download')}
            </Button>
            <Typography.Text type="secondary">{t('deviation.legend')}</Typography.Text>
          </Space>
          <Table<DeviationRow>
            size="small"
            bordered
            rowKey="key"
            pagination={false}
            dataSource={rows}
            columns={columns}
            scroll={{ x: 230 + DEVIATION_CATEGORIES.length * 468 }}
            sticky={STICKY_HEADER}
            rowClassName={(r) => (r.kind === 'section' ? (styles.sectionRow ?? '') : '')}
            onRow={(r) =>
              r.kind === 'block'
                ? {}
                : {
                    style: {
                      fontWeight: 600,
                      background:
                        r.kind === 'total'
                          ? token.colorWarningBg
                          : r.kind === 'section'
                            ? token.colorPrimaryBg
                            : token.colorFillAlter,
                      color: r.kind === 'section' ? token.colorPrimaryText : undefined,
                    },
                  }
            }
          />
        </>
      )}
    </Space>
  );
}
