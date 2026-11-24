import { Button, Card, Col, Layout, Row, Typography } from 'antd';
import { t } from '../../shared/i18n/t';
import type { I18nKey } from '../../shared/i18n/en';
import { useAppStore } from '../../store';
import { PAGES, navigate } from '../routes';
import styles from '../AppLayout.module.css';

const DESCRIPTION: Record<(typeof PAGES)[number]['id'], I18nKey> = {
  extraction: 'home.extraction.desc',
  drilling: 'home.drilling.desc',
  resources: 'home.resources.desc',
  deviation: 'home.deviation.desc',
  benchline: 'home.benchline.desc',
};

/** Start page: choose which work to do. */
export function HomePage() {
  /** Loaded blocks per page; the resource page keeps no data between visits. */
  const counts: Partial<Record<(typeof PAGES)[number]['id'], number>> = {
    extraction: useAppStore((s) => s.blocks.length),
    drilling: useAppStore((s) => s.drilling.blocks.length),
  };
  return (
    <Layout.Content className={styles.home}>
      <div className={styles.homeInner}>
        <Typography.Title level={3}>{t('home.title')}</Typography.Title>
        <Row gutter={[16, 16]}>
          {PAGES.map((p) => (
            <Col key={p.id} xs={24} md={12}>
              <Card
                hoverable
                title={t(p.titleKey)}
                onClick={() => navigate(p.id)}
                style={{ height: '100%' }}
              >
                <Typography.Paragraph type="secondary">{t(DESCRIPTION[p.id])}</Typography.Paragraph>
                {counts[p.id] !== undefined && (
                  <Typography.Paragraph>
                    {(counts[p.id] ?? 0) > 0
                      ? t('home.blocksLoaded', { count: counts[p.id] ?? 0 })
                      : t('home.noBlocks')}
                  </Typography.Paragraph>
                )}
                <Button type="primary">{t('home.open')}</Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Layout.Content>
  );
}
