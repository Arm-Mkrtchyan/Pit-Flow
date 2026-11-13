import { Alert, Button, Card, Col, Layout, Row, Typography } from 'antd';
import { t } from '../../shared/i18n/t';
import type { I18nKey } from '../../shared/i18n/en';
import { useAppStore } from '../../store';
import { PAGES, navigate } from '../routes';
import styles from '../AppLayout.module.css';

const DESCRIPTION: Record<(typeof PAGES)[number]['id'], I18nKey> = {
  extraction: 'home.extraction.desc',
  drilling: 'home.drilling.desc',
};

/** Start page: choose which work to do. */
export function HomePage() {
  const blockCount = useAppStore((s) => s.blocks.length);
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
                <Button type="primary">{t('home.open')}</Button>
              </Card>
            </Col>
          ))}
        </Row>
        <Alert
          style={{ marginTop: 24 }}
          type="info"
          showIcon
          message={
            blockCount > 0
              ? t('home.blocksShared', { count: blockCount })
              : t('home.blocksSharedEmpty')
          }
        />
      </div>
    </Layout.Content>
  );
}
