import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        driver: resolve(__dirname, 'driver/index.html'),
      }
    }
  }
});

