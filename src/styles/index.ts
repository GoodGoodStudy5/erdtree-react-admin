/**
 * `src/styles` 按「怎么生效」分三类, 加东西前先认清它属于哪一类:
 *
 * · `common/` —— 全局 CSS 的加载编排, 顺序写在那份 index.ts 的行序里, main.tsx 只 import 本门面.
 * · `fragment/` —— 只被别的 less `@import`, 自己不是入口, 不要给它们加 JS import.
 * · `variable.less` —— vite 的 `additionalData` 注入到每个 less 文件, 路径写在 vite 配置里.
 *
 * 组件自己的 less 不在本目录, 跟着组件走.
 */

import './common';
