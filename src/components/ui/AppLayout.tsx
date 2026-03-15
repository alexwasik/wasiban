'use client';

import React from 'react';
import { Button, theme } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { useThemeMode } from '@/contexts/ThemeContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { mode, toggleMode } = useThemeMode();
  const { token } = theme.useToken();

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 24px',
          height: '64px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          href='/'
          style={{
            color: token.colorText,
            fontSize: '20px',
            fontWeight: 'bold',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Wasiban
        </Link>
        <Button
          type='text'
          icon={mode === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          onClick={toggleMode}
          style={{ fontSize: '18px', color: token.colorText }}
          title={
            mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }
        />
      </header>
      <div
        style={{ display: 'flex', flex: 1, alignItems: 'stretch', minHeight: 'calc(100vh - 64px)' }}
      >
        <Sidebar />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: '24px',
            background: token.colorBgLayout,
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
