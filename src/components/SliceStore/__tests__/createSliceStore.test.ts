import { describe, expect, it, vi } from 'vitest';
import { createSliceStore } from '../createSliceStore';

interface Shape {
  a: number;
  b: string;
  [key: string]: unknown;
}

/** 造一个两片的容器, 各带一个通知 */
function make() {
  const onA = vi.fn();
  const onB = vi.fn();
  const store = createSliceStore<Shape>({
    a: { initial: 1, onChange: onA },
    b: { initial: 'x', onChange: onB },
  });

  return { store, onA, onB };
}

describe('createSliceStore', () => {
  it('按片读写', () => {
    const { store } = make();

    expect(store.get('a')).toBe(1);
    store.set('a', (current) => (current as number) + 1);
    expect(store.get('a')).toBe(2);
    expect(store.get('b')).toBe('x');
  });

  it('只通知变了的那片', () => {
    const { store, onA, onB } = make();

    store.set('a', () => 9);

    expect(onA).toHaveBeenCalledWith(9);
    expect(onB).not.toHaveBeenCalled();
  });

  it('值没变则不通知 —— 变没变按引用判', () => {
    const same = { k: 1 };
    const onChange = vi.fn();
    const store = createSliceStore<{ o: { k: number }; [key: string]: unknown }>({
      o: { initial: same, onChange },
    });

    store.set('o', () => same);
    expect(onChange).not.toHaveBeenCalled();

    store.set('o', () => ({ k: 1 }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('patch 一次改多片, 订阅者看不到半截状态', () => {
    const { store, onA, onB } = make();
    const seen: string[] = [];

    store.subscribe('a', () =>
      seen.push(`a=${String(store.get('a'))} b=${String(store.get('b'))}`),
    );
    store.patch({ a: 2, b: 'y' });

    // 订阅 a 时读 b, 读到的必须已经是新值
    expect(seen).toEqual(['a=2 b=y']);
    expect(onA).toHaveBeenCalledWith(2);
    expect(onB).toHaveBeenCalledWith('y');
  });

  it('按片订阅: 别的片变了不触发', () => {
    const { store } = make();
    const onA = vi.fn();

    store.subscribe('a', onA);
    store.set('b', () => 'y');
    expect(onA).not.toHaveBeenCalled();

    store.set('a', () => 2);
    expect(onA).toHaveBeenCalledWith(2);
  });

  it('退订后不再收到', () => {
    const { store } = make();
    const listener = vi.fn();
    const off = store.subscribe('a', listener);

    off();
    store.set('a', () => 2);

    expect(listener).not.toHaveBeenCalled();
  });

  it('销毁后读写无效, 订阅一律退订', () => {
    const { store, onA } = make();
    const listener = vi.fn();

    store.subscribe('a', listener);
    store.destroy();
    store.set('a', () => 99);

    expect(store.isDestroyed()).toBe(true);
    expect(store.get('a')).toBe(1);
    expect(listener).not.toHaveBeenCalled();
    expect(onA).not.toHaveBeenCalled();
  });
});
