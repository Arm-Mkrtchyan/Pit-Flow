import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // highs ships its own WASM; let Vite serve it as a plain asset instead of pre-bundling.
  optimizeDeps: { exclude: ['highs'] },
  worker: { format: 'es' },
});
