import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    server: {
      deps: {
        inline: ['server-only'],
      },
    },
    alias: {
      '@': resolve(__dirname, '.'),
      'server-only': resolve(__dirname, './tests/mocks/server-only.ts'),
    },
  },
});
