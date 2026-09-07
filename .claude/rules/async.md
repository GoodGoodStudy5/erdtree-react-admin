---
paths:
  - "src/pages/**/*.ts"
  - "src/pages/**/*.tsx"
  - "src/components/**/*.ts"
  - "src/components/**/*.tsx"
---

# 异步函数

- 异步函数名以 `async` 开头, 如 `asyncGetBills`. 事件处理器 (`on` / `handle` 开头) 豁免 —— 那两个前缀已经是角色标记.
- 辖区只到 `src/pages` 与 `src/components`. `servers` 层的 `apiXxx` 不改名: `api` 前缀本身就是标记.
- `useRequest` 取 `runAsync`, 不取 `run`. 结果与异常都该到得了调用点.
- 没人接的那次失败不必手抄 catch: `src/main.tsx` 的 `unhandledrejection` 兜住并记一行日志.
- `packages/` 不在此列 —— `SearchSelect` 的防抖搜索靠 `run`, 而防抖只作用于 `run`.

判据落在 `eslint.config.js` 的 `ASYNC_NAMING` 与 `NO_SYNC_RUN`, 改规则去改那里.
