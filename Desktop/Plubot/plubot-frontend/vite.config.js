import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/create-bot': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/update-bot': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/delete-bot': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/chat': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/connect-whatsapp': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/list-bots': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});