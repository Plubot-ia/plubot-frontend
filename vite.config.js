import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@context': path.resolve(__dirname, './src/context'),
      '@core': path.resolve(__dirname, './src/core'),
      '@utilities': path.resolve(__dirname, './src/utilities'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1000, // Aumentado para evitar advertencias con dependencias grandes
    minify: 'esbuild',
    target: 'esnext',
    sourcemap: false, // Desactivado para builds más rápidos, actívalo si necesitas depurar
  },
});