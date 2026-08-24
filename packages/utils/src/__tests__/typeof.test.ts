import { describe, expect, it } from 'vitest';
// 用例站在包外看这个工具库, 所以从门面取件, 不走深层路径
import { superTypeof } from '@south/utils';

describe('superTypeof', () => {
  it('原始类型与 typeof 一致', () => {
    expect(superTypeof('a')).toBe('string');
    expect(superTypeof(1)).toBe('number');
    expect(superTypeof(undefined)).toBe('undefined');
    expect(superTypeof(() => undefined)).toBe('function');
  });

  it('typeof 全答 object 的那些各自报出内部类别', () => {
    expect(superTypeof({})).toBe('object');
    expect(superTypeof([])).toBe('array');
    expect(superTypeof(null)).toBe('null');
    expect(superTypeof(new Date())).toBe('date');
    expect(superTypeof(/a/)).toBe('regexp');
  });
});
