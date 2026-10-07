import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Backend tests run in node (default). Frontend test files opt into jsdom with
// a `// @vitest-environment jsdom` comment at the top of the file.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    // Tests must never call real AI or marketplace APIs.
    env: { GEMINI_API_KEY: '' },
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', 'src/data/mockData.ts'],
    },
  },
});
