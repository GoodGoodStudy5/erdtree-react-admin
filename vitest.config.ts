import { defineConfig } from 'vitest/config';

/**
 * 运行时用例只覆盖 packages/components: 那里是对外交付的组件库, 行为回归要有用例把关.
 * 应用侧 src 的页面装配不进这条缝, 它由类型与目录门禁看住.
 *
 * 只收 __tests__ 目录里的用例, 与 eslint 的 folder-match-with-fex 同一口径:
 * 放错位置的用例不会被"顺便跑掉", 而是当场没人跑, 于是能被发现.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['packages/components/src/**/__tests__/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
