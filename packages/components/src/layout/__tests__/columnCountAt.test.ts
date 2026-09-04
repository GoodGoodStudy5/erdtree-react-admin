import { describe, expect, it } from 'vitest';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { columnCountAt } from '@south/components';

/**
 * antd 的响应式档位: xs 是 max-width 查询, 只在最窄时命中; 其余是 min-width, 宽档命中时窄档也命中.
 * 用例照这个事实构造, 不然「取命中的最宽一档」这条判据测不出真行为.
 */
const XS = { xs: true };
const SM = { sm: true };
const MD = { sm: true, md: true };
const LG = { sm: true, md: true, lg: true };
const XL = { sm: true, md: true, lg: true, xl: true };
const XXL = { sm: true, md: true, lg: true, xl: true, xxl: true };

describe('columnCountAt', () => {
  it('xs 整行: 声明几列都只排一列', () => {
    expect(columnCountAt(1, XS)).toBe(1);
    expect(columnCountAt(4, XS)).toBe(1);
  });

  it('sm 半行: 声明几列都排两列', () => {
    expect(columnCountAt(3, SM)).toBe(2);
    expect(columnCountAt(4, SM)).toBe(2);
  });

  it('md 与 lg 有 8 格保底: 声明 4 列也只排得下 3 列', () => {
    expect(columnCountAt(4, MD)).toBe(3);
    expect(columnCountAt(4, LG)).toBe(3);
    // 保底只抬不压: 声明 2 列时列宽 12 格, 比保底宽, 照声明排
    expect(columnCountAt(2, MD)).toBe(2);
  });

  it('xl 按声明的列数排', () => {
    expect(columnCountAt(4, XL)).toBe(4);
    expect(columnCountAt(3, XL)).toBe(3);
  });

  it('比 xl 更宽的档沿用 xl: 本库不下发 xxl, antd 就用最后给到的那档', () => {
    expect(columnCountAt(4, XXL)).toBe(4);
  });

  it('一档都没命中时按最宽那档答: 首帧还没订阅上断点, 桌面是常态', () => {
    expect(columnCountAt(4, {})).toBe(4);
    expect(columnCountAt(4)).toBe(4);
  });

  it('不给列数时用与 RowLayout 同一个默认值', () => {
    expect(columnCountAt(undefined, XL)).toBe(3);
  });
});
