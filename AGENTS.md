# AGENTS.md

## 规则住在哪

| 管什么 | 配置 |
| --- | --- |
| index 只能是门面、页面文件命名、跨目录导出必须带 TSDoc、导入按模块合并且 type 与值分条、语言订阅只在 `AppRouter`、用例只从包门面取件 | `eslint.config.js` |
| 目录边界、页面引用方向、循环依赖 | `.dependency-cruiser.mjs` |
| 组件库用例的位置与运行环境 | `vitest.config.ts` |

## 校验分两档

| 命令 | 范围 | 内容 | 钩子 |
| --- | --- | --- | --- |
| `pnpm check` | 只扫已暂存的文件 | eslint、stylelint、prettier，自动修复 | pre-commit |
| `pnpm check:full` | 全量 | 上面全部 + 类型检查 + 目录边界与循环依赖 + 组件库用例 | pre-push |

改规则去改配置，不用回来改这份文档。