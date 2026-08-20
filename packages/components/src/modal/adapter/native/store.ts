import type { CloseReason, ModalComponent } from '../../types';

/**
 * 载体不上报"退场动画已结束"时的兜底移除延时.
 * 对齐 antd 的默认动画时长 —— 用 ModalShell 的弹窗会经 afterClose 提前移除, 这里只兜住裸组件.
 */
const FALLBACK_REMOVE_DELAY = 300;

type Settle = (value: unknown) => void;
type Guard = (reason: CloseReason) => boolean | Promise<boolean>;

/** 一次 open 对应一个实例. 叠层时各自独立, 结果互不串台 */
export type ModalInstance = {
  readonly id: number;
  readonly Comp: ModalComponent;
  readonly props: Record<string, unknown>;
  /** 转 false 后进入退场, 动画结束或兜底计时到点才真正移除 */
  readonly visible: boolean;
  /** 提交进行中. 期间拒绝一切关闭请求, 因为数据已在提交路上 */
  readonly busy: boolean;
};

type Entry = ModalInstance & {
  settle: Settle;
  guard?: Guard;
  removeTimer?: ReturnType<typeof setTimeout>;
};

let entries: readonly Entry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function publish(next: readonly Entry[]) {
  entries = next;
  listeners.forEach((listener) => listener());
}

function find(id: number) {
  return entries.find((entry) => entry.id === id);
}

function patch(id: number, changes: Partial<Entry>) {
  publish(entries.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function getSnapshot() {
  return entries;
}

/** 把实例从列表移除. 幂等 —— 兜底计时与 afterClose 谁先到都行 */
function remove(id: number) {
  const entry = find(id);
  if (!entry) return;
  if (entry.removeTimer) clearTimeout(entry.removeTimer);
  publish(entries.filter((item) => item.id !== id));
}

/** 交付结果并进入退场 */
function settle(id: number, value: unknown) {
  const entry = find(id);
  if (!entry) return;
  entry.settle(value);
  patch(id, {
    visible: false,
    removeTimer: setTimeout(() => remove(id), FALLBACK_REMOVE_DELAY),
  });
}

/** 用户请求关闭. 提交中直接拒绝, 其余先过弹窗自己注册的拦截 */
async function requestClose(id: number, reason: CloseReason = 'userRequest') {
  const entry = find(id);
  if (!entry || entry.busy) return;
  if (entry.guard && !(await entry.guard(reason))) return;
  settle(id, undefined);
}

/** 某个实例是否还在显示. 交原始值, 让订阅方的依赖项停在 boolean 上 */
function isVisible(id: number) {
  return find(id)?.visible ?? false;
}

function setBusy(id: number, busy: boolean) {
  if (find(id)) patch(id, { busy });
}

function registerGuard(id: number, guard: Guard | undefined) {
  if (find(id)) patch(id, { guard });
}

/**
 * 挂载点消失时清账. 每个未结算的 Promise 都交出 undefined, 等同用户取消.
 * 不能让它们永久悬挂 —— 那是静默失败.
 */
function discardAll() {
  const pending = entries;
  publish([]);
  pending.forEach((entry) => {
    if (entry.removeTimer) clearTimeout(entry.removeTimer);
    entry.settle(undefined);
  });
}

/**
 * 排队一个弹窗. 挂载点还没出现时照常入列, 等它挂上来再补渲染 ——
 * store 才是事实来源, 挂载点只是显示器.
 */
function push(Comp: ModalComponent, props: Record<string, unknown>) {
  return new Promise<unknown>((resolve) => {
    const id = nextId++;
    publish([...entries, { id, Comp, props, visible: true, busy: false, settle: resolve }]);
  });
}

export const modalStore = {
  subscribe,
  getSnapshot,
  isVisible,
  push,
  settle,
  remove,
  requestClose,
  setBusy,
  registerGuard,
  discardAll,
};
