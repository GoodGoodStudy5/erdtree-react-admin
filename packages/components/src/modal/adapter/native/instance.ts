import { createContext, useContext, useSyncExternalStore } from 'react';
import type { ModalInstance } from './store';
import { modalStore } from './store';

/**
 * 当前弹窗实例的 id. 只往下传这一个原始值.
 *
 * 命令都是 modalStore 上的模块级函数, 身份天然恒定; 把它们包成一个随实例状态重建的对象再发下来,
 * 等于给稳定的东西套了个不稳定的壳, 下游还要为这个壳付依赖比较的钱.
 *
 * null 表示组件不是被 openModal 调起的 —— 直接在 JSX 里当受控组件用时就是这种情况, 外壳层需要能容忍.
 */
export const ModalIdContext = createContext<number | null>(null);

/** 取当前弹窗实例的 id. null 表示不是被 openModal 调起的 */
export function useModalId(): number | null {
  return useContext(ModalIdContext);
}

/**
 * 订阅某个实例的显示态. 交出的是布尔原始值而非实例对象, 调用方的依赖项因此停在原始值上.
 * 不是被 openModal 调起时恒为显示 —— 那时开关归 JSX 的使用者管.
 */
export function useModalVisible(id: number | null): boolean {
  const getSnapshot = () => (id === null ? true : modalStore.isVisible(id));
  return useSyncExternalStore(modalStore.subscribe, getSnapshot, getSnapshot);
}

/**
 * 订阅当前全部弹窗实例, 按调起顺序. 只读 —— push / settle / discardAll 不外开,
 * 开合只有 openModal 与 requestCloseModal 两个口.
 */
export function useModalInstances(): readonly ModalInstance[] {
  return useSyncExternalStore(modalStore.subscribe, modalStore.getSnapshot, modalStore.getSnapshot);
}

/**
 * 同步读此刻的实例表. 给 effect 里要「此刻」而非「渲染时那一份」的调用方 ——
 * 同一拍里刚 openModal 出来的实例, 渲染时的快照还看不见.
 */
export function getModalInstances(): readonly ModalInstance[] {
  return modalStore.getSnapshot();
}

/**
 * 代调用方请求关闭某个实例, 等同用户点关闭 —— 过 useCloseGuard, 提交中拒绝.
 * 调用方收到 undefined, 与用户主动关窗不可区分.
 * @param id - 实例 id, 从 useModalId 取
 */
export function requestCloseModal(id: number): void {
  void modalStore.requestClose(id);
}
