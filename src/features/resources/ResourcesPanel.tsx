import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd';
import { t, unit } from '../../shared/i18n/t';
import { fmtInt } from '../../shared/format';
import { fromIso } from '../calendar';
import type { ResourceRowResult, ResourceStatus } from './resourceCsv';
import { useResources } from './useResources';

const STATUS: Record<ResourceStatus, { color: string; key: `resources.status.${ResourceStatus}` }> =
  {
    updated: { color: 'blue', key: 'resources.status.updated' },
    same: { color: 'green', key: 'resources.status.same' },
    notFound: { color: 'gold', key: 'resources.status.notFound' },
    noBlockNumber: { color: 'default', key: 'resources.status.noBlockNumber' },
  };

const fmtDate = (d: string) => fromIso(d).format('DD.MM.YYYY');

/** Resource calculation: actual workbook + resource file → resource file with actual totals. */
export function ResourcesPanel() {
  const { actuals, resource, loading, loadActuals, loadResource, result, download } =
    useResources();
  const count = (s: ResourceStatus) => result?.rows.filter((r) => r.status === s).length ?? 0;

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" title={t('resources.actuals.title')} style={{ height: '100%' }}>
            <Typography.Paragraph type="secondary">
              {t('resources.actuals.hint')}
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
                {t('resources.actuals.upload')}
              </Button>
            </Upload>
            {actuals && (
              <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                <Typography.Text strong>{actuals.name}</Typography.Text>
                <br />
                {t('resources.actuals.summary', {
                  rows: actuals.parsed.rows.length,
                  from: actuals.parsed.firstDate ? fmtDate(actuals.parsed.firstDate) : '—',
                  to: actuals.parsed.lastDate ? fmtDate(actuals.parsed.lastDate) : '—',
                })}
              </Typography.Paragraph>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" title={t('resources.file.title')} style={{ height: '100%' }}>
            <Typography.Paragraph type="secondary">{t('resources.file.hint')}</Typography.Paragraph>
            <Upload
              accept=".csv,.txt"
              showUploadList={false}
              beforeUpload={(f) => {
                void loadResource(f);
                return false;
              }}
            >
              <Button type="primary" loading={loading === 'resource'}>
                {t('resources.file.upload')}
              </Button>
            </Upload>
            {resource && (
              <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                <Typography.Text strong>{resource.name}</Typography.Text>
              </Typography.Paragraph>
            )}
          </Card>
        </Col>
      </Row>

      {!result ? (
        <Empty description={t('resources.needBoth')} />
      ) : (
        <>
          <Space wrap size="large" align="end">
            <Statistic title={t('resources.status.updated')} value={count('updated')} />
            <Statistic title={t('resources.status.same')} value={count('same')} />
            <Statistic
              title={t('resources.status.notFound')}
              value={count('notFound') + count('noBlockNumber')}
            />
            <Button type="primary" onClick={download}>
              {t('resources.download')}
            </Button>
          </Space>
          {result.rows.length === 0 && (
            <Alert type="warning" showIcon message={t('resources.noRows')} />
          )}
          <Table<ResourceRowResult>
            size="small"
            bordered
            rowKey="line"
            pagination={false}
            dataSource={result.rows}
            columns={[
              { title: t('resources.col.line'), dataIndex: 'line', width: 70, align: 'right' },
              { title: t('resources.col.location'), dataIndex: 'location' },
              {
                title: t('resources.col.block'),
                dataIndex: 'key',
                render: (k: string | null) => k?.toUpperCase() ?? '—',
              },
              {
                title: `${t('resources.col.old')}, ${unit('t')}`,
                dataIndex: 'oldValue',
                align: 'right',
                render: (v: number | null) => fmtInt(v),
              },
              {
                title: `${t('resources.col.actual')}, ${unit('t')}`,
                dataIndex: 'actual',
                align: 'right',
                render: (v: number | null) => fmtInt(v),
              },
              {
                title: `${t('resources.col.new')}, ${unit('t')}`,
                dataIndex: 'newValue',
                align: 'right',
                render: (v: number | null, r) =>
                  r.status === 'updated' ? (
                    <Typography.Text strong>{fmtInt(v)}</Typography.Text>
                  ) : (
                    fmtInt(v)
                  ),
              },
              {
                title: t('resources.col.status'),
                dataIndex: 'status',
                render: (s: ResourceStatus) => (
                  <Tag color={STATUS[s].color}>{t(STATUS[s].key)}</Tag>
                ),
              },
            ]}
          />
        </>
      )}
    </Space>
  );
}
