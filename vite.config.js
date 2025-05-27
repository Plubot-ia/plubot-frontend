import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.webp', '**/*.png', '**/*.svg', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.ico'],
  base: '/',
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
    host: 'localhost',
    port: 5173,
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    proxy: {
      '^/api/.*': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[PROXY ERROR]', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[PROXY] Sending request to:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[PROXY] Received response:', req.method, req.url, '->', proxyRes.statusCode);
          });
        }
      },
    },
  },
  build: {
    outDir: 'dist', 
    chunkSizeWarningLimit: 1500,
    minify: 'esbuild',
    target: 'esnext',
    sourcemap: true, // Habilitar sourcemaps para facilitar la depuración
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@emotion/react', '@emotion/styled'],
          flow: ['reactflow', 'zustand'],
          utils: ['axios', 'lodash', 'uuid', 'zod'],
          // Asegurar que los servicios estén en un chunk separado
          services: ['@/services/flowService']
        }
      }
    },
    assetsInlineLimit: 4096,
  },
});