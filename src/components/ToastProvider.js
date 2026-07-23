"use client";

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(20, 20, 25, 0.9)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        },
        success: {
          iconTheme: {
            primary: '#00f576',
            secondary: '#000',
          },
        },
        error: {
          iconTheme: {
            primary: '#ff4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}
