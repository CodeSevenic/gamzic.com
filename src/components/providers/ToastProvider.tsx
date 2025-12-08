'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid rgba(0, 212, 255, 0.2)',
        },
        success: {
          iconTheme: {
            primary: '#00ff88',
            secondary: '#1e293b',
          },
        },
        error: {
          iconTheme: {
            primary: '#ff00aa',
            secondary: '#1e293b',
          },
        },
      }}
    />
  );
}

