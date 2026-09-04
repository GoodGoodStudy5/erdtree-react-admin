import { describe, expect, it } from 'vitest';
import { isBlank, isBlankEqual, syncKeys } from '../formValue';

describe('isBlank', () => {
  it('只有这四样算空', () => {
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank('')).toBe(true);
    expect(isBlank([])).toBe(true);
  });

  it('0 与 false 是填了的值', () => {
    expect(isBlank(0)).toBe(false);
    expect(isBlank(false)).toBe(false);
  });
});

describe('isBlankEqual', () => {
  it('各种空互相相等', () => {
    expect(isBlankEqual(undefined, '')).toBe(true);
    expect(isBlankEqual(null, [])).toBe(true);
  });

  it('空与非空不等', () => {
    expect(isBlankEqual('', 'a')).toBe(false);
    expect(isBlankEqual([], [1])).toBe(false);
  });

  it('数组逐项比, 不看引用', () => {
    expect(isBlankEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isBlankEqual(['a'], ['b'])).toBe(false);
  });

  it('非空按值比', () => {
    expect(isBlankEqual(1, 1)).toBe(true);
    expect(isBlankEqual(1, 2)).toBe(false);
  });
});

describe('syncKeys', () => {
  /** 表单里当前是什么, 用例各自给 */
  const formOf = (values: Record<string, unknown>) => (name: string) => values[name];

  it('已提交条件变了且与表单不同, 才写', () => {
    const keys = syncKeys({ a: 1 }, { a: 1, b: 2 }, formOf({ a: 1 }));

    expect(keys).toEqual(['b']);
  });

  it('点搜索之后不写: 已提交条件是从表单来的, 两者本来就一样', () => {
    // 用户填了 b 并点搜索, 已提交条件随之变化, 但表单里早就有这个值
    const keys = syncKeys({ a: 1 }, { a: 1, b: 2 }, formOf({ a: 1, b: 2 }));

    expect(keys).toEqual([]);
  });

  it('没变的项不写, 用户填了一半的内容保得住', () => {
    // 用户正在 c 里输入, 而外部只改了 b
    const keys = syncKeys({ a: 1, c: '' }, { a: 1, b: 2, c: '' }, formOf({ a: 1, c: '半截' }));

    expect(keys).toEqual(['b']);
  });

  it('已提交条件里某项被清空, 也算变了', () => {
    const keys = syncKeys({ a: 1 }, {}, formOf({ a: 1 }));

    expect(keys).toEqual(['a']);
  });

  it('空值归一: 输了又删光不算变', () => {
    const keys = syncKeys({ a: undefined }, { a: '' }, formOf({ a: undefined }));

    expect(keys).toEqual([]);
  });

  it('首次挂载把已提交条件铺进空表单', () => {
    const keys = syncKeys({}, { a: 1, b: 2 }, formOf({}));

    expect(keys).toEqual(['a', 'b']);
  });
});
