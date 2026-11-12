import type { ReactNode } from 'react';
import { Layout, Typography } from 'antd';
import { t } from '../shared/i18n/t';
import { LanguageSwitch } from './LanguageSwitch';
import styles from './AppLayout.module.css';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export function AppLayout({ left, center, right }: AppLayoutProps) {
  return (
    <Layout className={styles.root}>
      <Header className={styles.header}>
        <Typography.Title level={4} className={styles.title}>
          {t('app.title')}
        </Typography.Title>
        <Typography.Text className={styles.subtitle}>{t('app.subtitle')}</Typography.Text>
        <div className={styles.headerRight}>
          <LanguageSwitch />
        </div>
      </Header>
      <Layout>
        <Sider width={340} theme="light" className={styles.sider} aria-label={t('layout.blocks')}>
          {left}
        </Sider>
        <Content className={styles.content} aria-label={t('layout.schedule')}>
          {center}
        </Content>
        <Sider width={300} theme="light" className={styles.sider} aria-label={t('layout.calendar')}>
          {right}
        </Sider>
      </Layout>
    </Layout>
  );
}
