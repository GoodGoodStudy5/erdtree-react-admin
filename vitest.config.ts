import { defineConfig } from 'vitest/config';

/**
 * 运行时用例只覆盖 packages/components: 那里是对外交付的组件库, 行为回归要有用例把关.
 * 应用侧 src 的页面装配不进这条缝, 它由类型与目录门禁看住.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['packages/components/src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
