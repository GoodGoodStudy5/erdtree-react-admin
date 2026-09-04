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

`check:full` 跑通后把当前提交记进 `.git/check-full.stamps`, pre-push 命中就跳过全量校验. 记账与命中都要求工作区干净 —— 带未提交改动跑出的结论不属于任何一个提交, 记了也没法复用. 代价认下: 手上留着未提交改动时, 每次 push 都全量重跑.

改规则去改配置，不用回来改这份文档。

## 工具管不到的

### 图标按需打包

图标写 `<Icon icon="集合:名字">`, 样式由 UnoCSS 在构建期只为扫到的名字生成, 没有运行时, 也没有联网兜底. 名字必须是完整字面量, 拼接出来的名字渲染为空白. 来自数据的图标名 (菜单) 先登记进 `src/menus/icons.ts` 的名单, 名单经 safelist 强制进产物. 集合装成 `@iconify-json/<集合>` 的 devDependency, 用哪个装哪个.

`packages/` 不用这套: 包不能依赖应用的 uno 配置, 图标从 `@ant-design/icons` 取.

### 吸附靠标记

要吸顶或吸底的元素写 `data-sticky="top"` / `data-sticky="bottom"`, 不自己写 `position: sticky` —— 退让距离由栈里的实际成员算出, 手写的偏移量在成员增减那天就错. 见 `src/components/Sticky`.

代价认下: 从吸附的元素到内容区之间不能有任何一层带 overflow, 那样的层没有定高就成了一个永不滚动的参照容器, 吸附于是永不触发.

拿不到 DOM 的第三方组件照 `--sticky-stacked-top` / `--sticky-stacked-bottom` 自己贴, 那是每条栈当前的总高度.