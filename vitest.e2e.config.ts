import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['e2e/**/*.e2e.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
});
