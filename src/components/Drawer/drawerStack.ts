import { useSyncExternalStore } from 'react';

/**
 * 开着的抽屉, 按打开先后. 末位压在最上面.
 *
 * 一员 = 一个 BaseDrawer, 不是一个 openModal 实例 —— 内联受控的抽屉也占位, 而居中弹窗不占.
 * 代价认下: 抽屉里开了弹窗再开抽屉, 新抽屉标 2 不标 3.
 */
let stack: readonly string[] = [];

/**
 * 退场途中还要标着的层号: 出栈那一刻记下, 卸载时清掉.
 *
 * 关窗那一刻不让层号跟着变, 是因为变了就要改这一层的 className 与 rootStyle, 而那次重渲染落在
 * rc-motion 加 -leave 与 -leave-active 之间 —— 两个类挤进同一次样式重算, 起始态没了, 面板于是
 * 直接跳走而不是滑走.
 */
const parting = new Map<string, number>();

const listeners = new Set<() => void>();

function publish(next: readonly string[]) {
  stack = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** 压在最上面那一员该标的层号. 0 表示不标: 只有栈顶标, 且只有一层时不标 */
function topBadge(key: string) {
  if (stack.length < 2) return 0;

  return stack.at(-1) === key ? stack.length : 0;
}

/**
 * 入栈. 幂等 —— 同一员重复登记不改变叠层序.
 * @param key - 抽屉实例的身份, 由 useId 给
 */
export function enterDrawerStack(key: string) {
  parting.delete(key);
  if (stack.includes(key)) return;

  publish([...stack, key]);
}

/**
 * 出栈. 挂在 open 转 false 那一刻, 不等退场动画 —— 关闭已经落定, 下面那层的号立刻就该准.
 * @param key - 抽屉实例的身份
 */
export function leaveDrawerStack(key: string) {
  if (!stack.includes(key)) return;

  const shown = topBadge(key);

  if (shown) parting.set(key, shown);
  publish(stack.filter((one) => one !== key));
}

/**
 * 卸载时清掉退场那一笔. 不广播 —— 这一员已经走了, 别人的层号一个都没变.
 * @param key - 抽屉实例的身份
 */
export function forgetDrawerStack(key: string) {
  parting.delete(key);
}

/**
 * 订阅这一员的层号. 交出的是数字原始值而非整条栈, 订阅方的依赖项因此停在原始值上.
 * @param key - 抽屉实例的身份
 */
export function useDrawerBadge(key: string): number {
  const getSnapshot = () => parting.get(key) ?? topBadge(key);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
