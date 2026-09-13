import { describe, expect, it } from 'vitest';
// 用例站在包外看这个工具库, 所以从门面取件, 不走深层路径
import { mergeSlots } from '@south/utils';

/** 两层槽位: 第一层 label 与 popup, popup 底下还有一层 */
interface Slots {
  label?: { whiteSpace?: string; color?: string };
  popup?: { root?: string; list?: string[] };
}

describe('mergeSlots', () => {
  it('调用方没给就用垫底的那份', () => {
    expect(mergeSlots<Slots, []>({ label: { whiteSpace: 'nowrap' } }, undefined)).toEqual({
      label: { whiteSpace: 'nowrap' },
    });
  });

  it('同一个槽两边都给, 逐层往下填, 同名的由调用方赢', () => {
    const merged = mergeSlots<Slots, []>(
      { label: { whiteSpace: 'nowrap', color: 'red' } },
      { label: { color: 'blue' } },
    );

    expect(merged).toEqual({ label: { whiteSpace: 'nowrap', color: 'blue' } });
  });

  it('调用方另设别的槽, 垫底那档也带着', () => {
    const merged = mergeSlots<Slots, []>(
      { label: { whiteSpace: 'nowrap' } },
      { popup: { root: 'pop' } },
    );

    expect(merged).toEqual({ label: { whiteSpace: 'nowrap' }, popup: { root: 'pop' } });
  });

  it('数组不逐项并, 由调用方整个拿走', () => {
    const merged = mergeSlots<Slots, []>(
      { popup: { list: ['a', 'b'] } },
      { popup: { list: ['c'] } },
    );

    expect(merged).toEqual({ popup: { list: ['c'] } });
  });

  it('求值函数留成函数: 取用时才算, 入参原样传进去', () => {
    const merged = mergeSlots<Slots, [string]>({ label: { whiteSpace: 'nowrap' } }, (size) => ({
      label: { color: size },
    }));

    expect(typeof merged).toBe('function');
    expect(typeof merged === 'function' ? merged('red') : merged).toEqual({
      label: { whiteSpace: 'nowrap', color: 'red' },
    });
  });
});
