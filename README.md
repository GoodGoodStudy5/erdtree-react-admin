# Aurum Nexus Front

后台管理前端。路由按 `src/pages` 的目录结构自动生成，无需手写路由表。

## 启动

需要 Node `^20.19.0` 或 `>=22.12.0`、pnpm `>=11`，版本不符 `pnpm install` 会直接拒绝。

```bash
pnpm install -w
pnpm dev
```

打开终端打印的地址即可。`-w` 是 monorepo 根安装标记，不能省。装依赖卡住多半是网络问题，`pnpm config set registry https://registry.npmmirror.com` 后重试。

## 校验分两档

| 命令 | 范围 | 内容 | 钩子 |
| --- | --- | --- | --- |
| `pnpm check` | 只扫已暂存的文件 | eslint、stylelint、prettier，自动修复 | pre-commit |
| `pnpm check:full` | 全量 | 上面全部 + 类型检查 + 目录边界与循环依赖 | pre-push |

快的挡提交、慢的挡推送。两个钩子调的就是这两条命令，本地手动跑能复现钩子行为。提交被 husky 拒绝又看不出原因时，先 `npx husky install` 再重试。

其余命令看 `package.json` 的 scripts。

## 约定与规范

目录边界、文件命名、导出形式、注释要求都由 ESLint 与 dependency-cruiser 强制，违反时报错会说明原因与改法，不需要先读文档。

[AGENTS.md](./AGENTS.md) 写的是工具说不出的部分：每条规则为什么这样定、否决过什么方案、工具管不到的约定、已知的校验盲区。
