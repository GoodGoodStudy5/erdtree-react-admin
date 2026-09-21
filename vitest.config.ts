import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * 用例覆盖两处: 对外交付的包, 与应用侧的共享组件. 后者虽然住在 src, 但它承载的是类型看不住的行为
 * (金额的负号即红蓝, 改查询条件要把页码重置回 1).
 *
 * 页面装配仍不进这条缝, 它由类型与目录门禁看住. service 层也不在内 —— 那里的换算 (页号换偏移量,
 * 后端两格换前端两格) 没有用例, 认下: 绕过适配层由 ESLint 守着, 而换算本身算错不报错.
 *
 * 只收 __tests__ 目录里的用例, 与 eslint 的 folder-match-with-fex 同一口径:
 * 放错位置的用例不会被"顺便跑掉", 而是当场没人跑, 于是能被发现.
 *
 * 已知边界两条:
 *   · 包名逐个列出而非 packages/*, 所以新包的用例要在这里补一笔才会被跑到.
 *   · 这里不装自动导入插件 (它会顺手重写 types/autoImports.d.ts), 所以 src/components 下的代码
 *     要显式 import 运行时值 —— 靠自动导入的那些在用例里是 undefined.
 */
export default defineConfig({
  // 与 tsconfig 的 paths 对齐: 用例里的 src 代码照常写 @/ 与 #/
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
      '#': path.resolve(process.cwd(), 'types'),
    },
  },
  test: {
    environment: 'jsdom',
    include: [
      'packages/{components,utils}/src/**/__tests__/*.test.{ts,tsx}',
      'src/components/**/__tests__/*.test.{ts,tsx}',
      'src/styles/__tests__/*.test.ts',
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
