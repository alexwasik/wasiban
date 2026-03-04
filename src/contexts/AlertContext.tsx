"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'antd';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertContextType {
  showAlert: (type: AlertType, message: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: '400px',
            maxWidth: '600px',
          }}
        >
          <Alert
            type={alert.type}
            description={alert.message}
            closable
            onClose={() => setAlert(null)}
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          />
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
