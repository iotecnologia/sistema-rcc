/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' para o build abrir de qualquer pasta (ex.: GitHub Pages)
export default defineConfig({
  plugins: [react()],
  base: './',
  // os dados da base (JSON) entram no pacote; no mock isso passa de 500 kB — na Fase 3 vêm da API
  build: { chunkSizeWarningLimit: 1200 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
