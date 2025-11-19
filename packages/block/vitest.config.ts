import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      '\\.(jpg|png|gif|svg|mp3|wav|ogg)$': new URL('./tests/__mocks__/file_mock.js', import.meta.url).pathname,
      '\\.(css|less)$': new URL('./tests/__mocks__/style_mock.js', import.meta.url).pathname
    },
    projects: [
      {
        test: {
          name: 'Unit Tests',
          include: ['./tests/unit/**/*.test.[jt]s'],
          environment: 'node'
        }
      }, {
        test: {
          name: 'DOM Tests',
          include: ['./tests/blocks/**/*.test.[jt]s'],
          environment: 'jsdom',
          setupFiles: ['./tests/setups/jsdom.setup.ts'],
          pool: 'vmThreads',
          deps: {
            optimizer: {
              web: {
                include: ['vitest-canvas-mock']
              }
            }
          }
        }
      }
    ]
  },
});
