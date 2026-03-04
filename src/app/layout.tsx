import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import { AlertProvider } from '@/contexts/AlertContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/ui/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wasiban - Personal Kanban Board',
  description: 'A personal Kanban board application for task management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AntdRegistry>
          <ThemeProvider>
            <AlertProvider>
              <AppLayout>{children}</AppLayout>
            </AlertProvider>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
