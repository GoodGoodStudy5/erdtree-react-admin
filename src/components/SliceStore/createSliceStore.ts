import { createStore } from 'zustand/vanilla';

/**
 * 多片状态的容器. 与业务无关, 也与查询无关 —— 它只认识「片」这一个概念.
 *
 * **设计标准: 这一层要能原样挪进 `packages/components`**, 因此它不引 `src` 的任何东西
 * (门禁 `no-package-to-src` 盯着那条边), 也不认识分页, 请求, 表单这些应用层概念.
 * 往这里加东西前先问一句: 一个与查询无关的组件用得上吗? 用不上就该加在查询层.
 *
 * 搬走的判据沿用仓库既有约定: 第二个消费者出现时再看.
 */

/** 片名到片值的映射. 片名与片的类型都由调用方定, 这一层不认识任何具体的片 */
export type SliceMap = Record<string, unknown>;

/** 一片状态的配置 */
export interface SliceConfig<T> {
  /** 初值. 这一层不知道什么算「空」, 所以必给 */
  initial: T;
  /** 该片变更后的通知 */
  onChange?: (next: T) => void;
}

/** 各片的配置 */
export type SliceConfigs<S extends SliceMap> = { [K in keyof S]: SliceConfig<S[K]> };

/**
 * 只读视图: 读一片与订阅一片.
 *
 * 桥要的就这两件事, 所以单列成一个更窄的口 —— 建在容器之上的那些 store (如查询层) 不必长成
 * 完整的容器, 只要能读能订阅就接得上桥.
 */
export interface ReadableSliceStore<S extends SliceMap> {
  /** 读某片当前的值 */
  get: <K extends keyof S>(slice: K) => S[K];
  /** 按片订阅. 返回退订函数 */
  subscribe: <K extends keyof S>(slice: K, listener: (value: S[K]) => void) => () => void;
}

/**
 * 按片读写, 按片订阅, 按片通知.
 *
 * **活在 React 外**: 读写直接摸它, 不经 React, 所以在事件处理器与异步回调里调都读得准, 没有陈旧闭包.
 * 要影响渲染的地方另外用 `useSlice` 按片订阅 —— 桥只服务渲染.
 *
 * **变没变按引用判**. 值语义的比较归调用方: 只有它知道自己那片怎么算相等.
 */
export interface SliceStore<S extends SliceMap> extends ReadableSliceStore<S> {
  /** 改一片 */
  set: <K extends keyof S>(slice: K, updater: (current: S[K]) => S[K]) => void;
  /** 一次改多片, 只走一轮通知. 跨片联动要的就是这个 —— 分两次改会让中间那个半截状态被订阅者看见 */
  patch: (next: Partial<S>) => void;
  /** 已销毁则读写一律无效. 要不要为此报错由调用方决定, 这一层只如实回答 */
  isDestroyed: () => boolean;
  /** 销毁. 之后 set 与 patch 静默无效, 已有的订阅一律退订 */
  destroy: () => void;
}

/**
 * 造一个多片状态容器.
 * @param configs - 各片的初值与变更通知
 */
export function createSliceStore<S extends SliceMap>(configs: SliceConfigs<S>): SliceStore<S> {
  const keys = Object.keys(configs) as (keyof S)[];
  const seed = {} as S;

  for (const key of keys) seed[key] = configs[key].initial;

  const store = createStore<S>(() => seed);
  /** 自己记一份退订函数: zustand 没有「全部退订」, 而销毁后还挂着的订阅会拖住整个 store 不被回收 */
  const unsubscribes = new Set<() => void>();
  let destroyed = false;

  /** 逐片比引用, 变了的那几片各通知一次 */
  const notify = (prev: S, next: S) => {
    for (const key of keys) {
      if (prev[key] !== next[key]) configs[key].onChange?.(next[key]);
    }
  };

  const patch: SliceStore<S>['patch'] = (next) => {
    if (destroyed) return;
    const prev = store.getState();

    store.setState(next);
    notify(prev, store.getState());
  };

  const api: SliceStore<S> = {
    get: (slice) => store.getState()[slice],
    set: (slice, updater) => {
      const next: Partial<S> = {};

      next[slice] = updater(store.getState()[slice]);
      patch(next);
    },
    patch,
    subscribe: (slice, listener) => {
      const unsubscribe = store.subscribe((state, prev) => {
        if (state[slice] !== prev[slice]) listener(state[slice]);
      });
      const off = () => {
        unsubscribes.delete(off);
        unsubscribe();
      };

      unsubscribes.add(off);

      return off;
    },
    isDestroyed: () => destroyed,
    destroy: () => {
      destroyed = true;
      for (const off of [...unsubscribes]) off();
    },
  };

  return api;
}
