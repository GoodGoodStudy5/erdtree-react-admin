import { useEffect, useRef } from 'react';
import { useModalInstance } from './instance';
import type { CloseReason, UseCloseGuardFn } from './types';

/**
 * 拦截关闭请求, 返回 false 则不关. 典型用途是表单改过之后确认放弃编辑.
 * 关闭来源只到达这里, 不会外泄给 open 的调用方.
 */
export const useCloseGuard: UseCloseGuardFn = (guard) => {
  const instance = useModalInstance();
  const latest = useRef(guard);

  // 每次渲染后同步最新的拦截函数, 注册时包一层间接引用, 避免因函数身份变化反复注册
  useEffect(() => {
    latest.current = guard;
  });

  const instanceId = instance?.id;
  const registerGuard = instance?.registerGuard;

  useEffect(() => {
    if (!registerGuard) return;
    registerGuard((reason: CloseReason) => latest.current(reason));
    return () => registerGuard(undefined);
  }, [instanceId, registerGuard]);
};
