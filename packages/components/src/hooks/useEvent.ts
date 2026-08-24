import { useCallback, useInsertionEffect, useRef } from 'react';

/**
 * 让回调的身份恒定, 内部读到的闭包始终是最新的. 对外交出的原语靠它兑现
 * 「身份稳定, 调用方可以放进自己的依赖数组」这条契约.
 *
 * 这是该能力的唯一切换点. 换实现或改签名前先看 __tests__/hooks.typetest.ts 里的 useEvent 用例,
 * 试过并否决的几条路记在那里.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- 换成带调用签名的约束会让参数推导静默失效, 见 __tests__/hooks.typetest.ts
export function useEvent<T extends Function>(callback: T): T {
  const latest = useRef(callback);

  useInsertionEffect(() => {
    latest.current = callback;
  }, [callback]);

  return useCallback((...args: unknown[]) => latest.current(...args), []) as unknown as T;
}
