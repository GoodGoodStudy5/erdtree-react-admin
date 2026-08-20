import { createContext, useContext, useSyncExternalStore } from 'react';
import { modalStore } from './store';

/**
 * 当前弹窗实例的 id. 只往下传这一个原始值.
 *
 * 命令都是 modalStore 上的模块级函数, 身份天然恒定; 把它们包成一个随实例状态重建的对象再发下来,
 * 等于给稳定的东西套了个不稳定的壳, 下游还要为这个壳付依赖比较的钱.
 *
 * null 表示组件不是被 open 调起的 —— 直接在 JSX 里当受控组件用时就是这种情况, 外壳层需要能容忍.
 */
export const ModalIdContext = createContext<number | null>(null);

/** 取当前弹窗实例的 id. null 表示不是被 open 调起的 */
export function useModalId(): number | null {
  return useContext(ModalIdContext);
}

/**
 * 订阅某个实例的显示态. 交出的是布尔原始值而非实例对象, 调用方的依赖项因此停在原始值上.
 * 不是被 open 调起时恒为显示 —— 那时开关归 JSX 的使用者管.
 */
export function useModalVisible(id: number | null): boolean {
  const getSnapshot = () => (id === null ? true : modalStore.isVisible(id));
  return useSyncExternalStore(modalStore.subscribe, getSnapshot, getSnapshot);
}
