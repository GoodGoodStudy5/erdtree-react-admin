import { describe, expect, it } from 'vitest';
// 用例站在包外看这个工具库, 所以从门面取件, 不走深层路径
import { strUtils, transString } from '@south/utils';

describe('strUtils.strSplitForCommon', () => {
  it('按给定分隔符切分并丢掉空项', () => {
    expect(strUtils.strSplitForCommon('a,b,,c', /,+/g)).toEqual(['a', 'b', 'c']);
  });

  it('空值给空数组', () => {
    expect(strUtils.strSplitForCommon('', /,/g)).toEqual([]);
    expect(strUtils.strSplitForCommon(null, /,/g)).toEqual([]);
    expect(strUtils.strSplitForCommon(undefined, /,/g)).toEqual([]);
  });
});

describe('strUtils.strSplitForEmail', () => {
  it('粘贴进来的多分隔符文本切成干净数组', () => {
    // 空格、半角逗号、全角逗号、半角分号、全角分号、不换行空格、换行都算分隔符
    const pasted = 'a@x.com b@x.com,c@x.com，d@x.com;e@x.com；f@x.com\u00A0g@x.com\nh@x.com';

    expect(strUtils.strSplitForEmail(pasted)).toEqual([
      'a@x.com',
      'b@x.com',
      'c@x.com',
      'd@x.com',
      'e@x.com',
      'f@x.com',
      'g@x.com',
      'h@x.com',
    ]);
  });

  it('连续分隔符与首尾分隔符都不留空项', () => {
    expect(strUtils.strSplitForEmail(' , a@x.com ,, b@x.com , ')).toEqual(['a@x.com', 'b@x.com']);
  });

  it('空值给空数组', () => {
    expect(strUtils.strSplitForEmail('   ')).toEqual([]);
    expect(strUtils.strSplitForEmail(null)).toEqual([]);
    expect(strUtils.strSplitForEmail(undefined)).toEqual([]);
  });
});

describe('transString', () => {
  it('有效值转 string', () => {
    expect(transString(12)).toBe('12');
    expect(transString('a')).toBe('a');
    expect(transString(true)).toBe('true');
  });

  it('假值一律给 undefined, 0 与空串也算', () => {
    expect(transString(0)).toBeUndefined();
    expect(transString('')).toBeUndefined();
    expect(transString(null)).toBeUndefined();
    expect(transString(undefined)).toBeUndefined();
    expect(transString(false)).toBeUndefined();
  });

  it('数组逐项同形处理', () => {
    expect(transString([1, 0, 'a', null, undefined])).toEqual([
      '1',
      undefined,
      'a',
      undefined,
      undefined,
    ]);
  });
});
