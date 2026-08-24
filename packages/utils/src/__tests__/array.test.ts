import { describe, expect, it } from 'vitest';
// 用例站在包外看这个工具库, 所以从门面取件, 不走深层路径
import {
  arrayAddKey,
  arrayFilterBoolean,
  arrayToItemMap,
  includesInArray,
  includesInArraySome,
} from '@south/utils';

describe('includesInArray', () => {
  it('命中返回 true, 不命中返回 false', () => {
    expect(includesInArray(['draft', 'paid'], 'paid')).toBe(true);
    expect(includesInArray(['draft', 'paid'], 'void')).toBe(false);
  });

  it('空范围一律不命中', () => {
    expect(includesInArray([], 'paid')).toBe(false);
  });
});

describe('includesInArraySome', () => {
  it('两个数组有交集即为 true', () => {
    expect(includesInArraySome(['draft', 'paid'], ['void', 'paid'])).toBe(true);
  });

  it('无交集或空数组为 false', () => {
    expect(includesInArraySome(['draft', 'paid'], ['void'])).toBe(false);
    expect(includesInArraySome(['draft', 'paid'], [])).toBe(false);
  });
});

describe('arrayAddKey', () => {
  it('不给字段名时按下标补 key', () => {
    expect(arrayAddKey([{ name: 'a' }, { name: 'b' }])).toEqual([
      { name: 'a', key: 0 },
      { name: 'b', key: 1 },
    ]);
  });

  it('给了字段名时取该字段作 key', () => {
    expect(arrayAddKey([{ id: 'x' }, { id: 'y' }], 'id')).toEqual([
      { id: 'x', key: 'x' },
      { id: 'y', key: 'y' },
    ]);
  });

  it('入参不是数组时原样返回', () => {
    expect(arrayAddKey(undefined)).toBeUndefined();
  });
});

describe('arrayFilterBoolean', () => {
  it('剔除全部假值, 保留其余项', () => {
    expect(arrayFilterBoolean([1, 0, 'a', '', null, undefined, false, 2])).toEqual([1, 'a', 2]);
  });

  it('不改动原数组', () => {
    const source = [1, null, 2];

    arrayFilterBoolean(source);
    expect(source).toEqual([1, null, 2]);
  });
});

describe('arrayToItemMap', () => {
  it('按指定字段转成映射对象', () => {
    expect(arrayToItemMap([{ id: 'x', name: 'a' }], 'id')).toEqual({
      x: { id: 'x', name: 'a' },
    });
  });

  it('needSort 时带上原始下标', () => {
    const map = arrayToItemMap([{ id: 'x' }, { id: 'y' }], 'id', { needSort: true });

    expect(map).toEqual({ x: { id: 'x', _sortIndex: 0 }, y: { id: 'y', _sortIndex: 1 } });
  });

  it('键重复时后一项覆盖前一项', () => {
    expect(
      arrayToItemMap(
        [
          { id: 'x', name: 'a' },
          { id: 'x', name: 'b' },
        ],
        'id',
      ),
    ).toEqual({
      x: { id: 'x', name: 'b' },
    });
  });

  it('入参不是数组时给空对象', () => {
    expect(arrayToItemMap(undefined as unknown as { id: string }[], 'id')).toEqual({});
  });
});
