import type { ReadableSliceStore, SliceMap } from './createSliceStore';
import { useSyncExternalStore } from 'react';

/**
 * 把 store 的一片桥进 React.
 *
 * 桥只服务渲染, 而且按片订阅 —— 只有订了那片的组件会重渲染, 别的不动. 读写都直接摸 store,
 * 不经这里.
 * @param store - 任何能读能订阅的多片 store
 * @param slice - 要订阅的片
 */
export function useSlice<S extends SliceMap, K extends keyof S>(
  store: ReadableSliceStore<S>,
  slice: K,
): S[K] {
  return useSyncExternalStore(
    (onChange) => store.subscribe(slice, onChange),
    () => store.get(slice),
  );
}
