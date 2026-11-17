import type { ReactNode } from 'react';
import { Layout, Segmented, Typography } from 'antd';
import { t } from '../shared/i18n/t';
import { LanguageSwitch } from './LanguageSwitch';
import { PAGES, navigate, pageHref, type PageId } from './routes';
import styles from './AppLayout.module.css';
import logoUrl from '../assets/pit-flow-logo-transparent.webp';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  page: PageId;
  children: ReactNode;
}

/** Header (app title → home, page switch, language) above the current page. */
export function AppLayout({ page, children }: AppLayoutProps) {
  return (
    <Layout className={styles.root}>
      <Header className={styles.header}>
        <a href={pageHref('home')} className={styles.titleLink} title={t('page.home')}>
          <img src={logoUrl} alt={t('app.title')} className={styles.logo} />
        </a>
        {page === 'home' ? (
          <Typography.Text type="secondary">{t('app.subtitle')}</Typography.Text>
        ) : (
          <Segmented<PageId>
            value={page}
            onChange={navigate}
            options={PAGES.map((p) => ({ value: p.id, label: t(p.titleKey) }))}
          />
        )}
        <div className={styles.headerRight}>
          <LanguageSwitch />
        </div>
      </Header>
      {children}
    </Layout>
  );
}

interface PageColumnsProps {
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
  centerLabel: string;
  rightLabel?: string;
}

/** Optional block list on the left, page content in the centre, optional right panel. */
export function PageColumns({ left, center, right, centerLabel, rightLabel }: PageColumnsProps) {
  return (
    <Layout>
      {left !== undefined && (
        <Sider width={340} theme="light" className={styles.sider} aria-label={t('layout.blocks')}>
          {left}
        </Sider>
      )}
      <Content className={styles.content} aria-label={centerLabel}>
        {center}
      </Content>
      {right !== undefined && (
        <Sider width={300} theme="light" className={styles.sider} aria-label={rightLabel}>
          {right}
        </Sider>
      )}
    </Layout>
  );
}
