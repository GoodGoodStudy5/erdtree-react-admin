import { createContext, useContext } from 'react';
import type { CloseReason } from '../../types';

/** 当前弹窗实例的把手. 由挂载点注入, 供外壳层与 useCloseGuard 取用 */
export type ModalInstanceApi = {
  readonly id: number;
  /** false 表示正在退场 */
  readonly visible: boolean;
  /** 提交进行中 */
  readonly busy: boolean;
  /** 交付结果并关闭 */
  resolve: (value: unknown) => void;
  /** 不交结果关闭 */
  cancel: () => void;
  /** 用户请求关闭. 会先过 useCloseGuard, 提交中则被拒绝 */
  requestClose: (reason?: CloseReason) => void;
  /** 标记提交进行中, 期间禁止关闭 */
  setBusy: (busy: boolean) => void;
  /** 注册关闭拦截 */
  registerGuard: (guard: ((reason: CloseReason) => boolean | Promise<boolean>) | undefined) => void;
  /** 退场动画放完了, 可以移除 */
  notifyClosed: () => void;
};

export const ModalInstanceContext = createContext<ModalInstanceApi | null>(null);

/**
 * 取当前弹窗实例. 返回 null 表示组件不是被 open 调起的 ——
 * 直接在 JSX 里当受控组件用时就是这种情况, 外壳层需要能容忍.
 */
export function useModalInstance(): ModalInstanceApi | null {
  return useContext(ModalInstanceContext);
}
