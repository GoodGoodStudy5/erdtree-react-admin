import { useEffect } from 'react';
import { modalStore, useModalId } from './adapter';
import type { UseCloseGuardFn } from './types';
import { useEvent } from '../hooks';

/**
 * 拦截关闭请求, 返回 false 则不关. 典型用途是表单改过之后确认放弃编辑.
 * 关闭来源只到达这里, 不会外泄给 openModal 的调用方.
 */
export const useCloseGuard: UseCloseGuardFn = (guard) => {
  const id = useModalId();
  // 身份恒定, 所以注册一次就够; 拦截逻辑每次渲染都是最新的
  const stableGuard = useEvent(guard);

  useEffect(() => {
    if (id === null) return;
    modalStore.registerGuard(id, stableGuard);
    return () => modalStore.registerGuard(id, undefined);
  }, [id, stableGuard]);
};
