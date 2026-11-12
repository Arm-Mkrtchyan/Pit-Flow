import type { ReactNode } from 'react';
import { App as AntApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { theme } from './theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={theme} locale={enUS}>
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  );
}
