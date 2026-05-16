import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      passWithNoTests: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'text-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/main.tsx',
          'src/vite-env.d.ts',
        ],
      },
    },
  }),
)
