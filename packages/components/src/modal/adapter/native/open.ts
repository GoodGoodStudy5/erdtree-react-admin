import { modalStore } from './store';
import type { CreateModalSetFn, ModalComponent, OpenFn } from '../../types';

/**
 * 命令式调起弹窗. 自由函数而非 hook, 所以工具函数、store action、请求拦截器里都能直接调.
 * 结果在 store 内部按 unknown 搬运, 类型由 OpenFn 在此边界处一次性保证.
 */
export const openModal = ((comp: ModalComponent, props?: Record<string, unknown>) =>
  modalStore.push(comp, props ?? {})) as OpenFn;

/**
 * 给一组弹窗起名字, 换取调用处更短的写法. 不是 hook, 可以写在模块顶层.
 * 它只做命名绑定, 不产出需要挂到 JSX 里的节点.
 */
export const createModalSet = ((set: Record<string, ModalComponent>) => {
  const bound: Record<string, { open: (props?: Record<string, unknown>) => Promise<unknown> }> = {};
  Object.keys(set).forEach((key) => {
    bound[key] = { open: (props) => modalStore.push(set[key], props ?? {}) };
  });
  return bound;
}) as CreateModalSetFn;
