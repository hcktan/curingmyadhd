import { defineConfig } from 'vitest/config';

/* Yalnızca Vitest için. Uygulama derlemesi electron.vite.config.ts içinde. */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
