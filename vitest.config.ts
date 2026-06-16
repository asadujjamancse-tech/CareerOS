import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts', 'electron/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'electron/services/vault/**/*.ts',
        'src/features/knowledge-vault/**/*.ts',
        'src/features/knowledge-vault/**/*.tsx',
      ],
    },
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@features': resolve(__dirname, 'src/features'),
    },
  },
})
