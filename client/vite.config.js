import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api requests are proxied to the Express server
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
});
