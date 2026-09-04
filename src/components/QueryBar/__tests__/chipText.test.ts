import type { BaseSearchList } from '#/form';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { chipTextOf } from '../chipText';

/** 造一个搜索项: 摘要只读 name 之外的展示口径, 所以用例只给用得上的那几个键 */
function item(partial: Partial<BaseSearchList> = {}): BaseSearchList {
  return { name: 'field', label: '字段', component: 'Input', ...partial };
}

describe('chipTextOf', () => {
  it('空值不成 chip: 摘要只放已填的条件', () => {
    expect(chipTextOf(item(), undefined)).toBeNull();
    expect(chipTextOf(item(), null)).toBeNull();
    expect(chipTextOf(item(), '')).toBeNull();
    expect(chipTextOf(item(), [])).toBeNull();
    expect(chipTextOf(item(), [undefined, undefined])).toBeNull();
  });

  it('0 与 false 是填了: 它们是值, 不是空', () => {
    expect(chipTextOf(item({ component: 'InputNumber' }), 0)).toBe('0');
    expect(chipTextOf(item({ component: 'Switch' }), false)).toBe('否');
    expect(chipTextOf(item({ component: 'Switch' }), true)).toBe('是');
  });

  it('下拉显示选项文案而不是码值: 摘要给人看, 码值只有后端认', () => {
    const kind = item({
      component: 'Select',
      componentProps: {
        options: [
          { label: '增值税专用发票', value: 'SPECIAL' },
          { label: '增值税普通发票', value: 'GENERAL' },
        ],
      },
    });

    expect(chipTextOf(kind, 'SPECIAL')).toBe('增值税专用发票');
    // 选项里没有的码值原样显示, 不吞掉
    expect(chipTextOf(kind, 'UNKNOWN')).toBe('UNKNOWN');
  });

  it('日期区间按控件的格式串显示两端', () => {
    const range = item({ component: 'RangePicker' });
    const value = [dayjs('2026-08-01'), dayjs('2026-08-31')];

    expect(chipTextOf(range, value)).toBe('2026-08-01 ~ 2026-08-31');
  });

  it('数值区间缺一端时写成不等式, 不把缺的那端说成 0', () => {
    const money = item({ component: 'customize' });

    expect(chipTextOf(money, [1000, 2000])).toBe('1000 ~ 2000');
    expect(chipTextOf(money, [1000, undefined])).toBe('≥ 1000');
    expect(chipTextOf(money, [undefined, 2000])).toBe('≤ 2000');
  });

  it('多值超过三项时收成计数, 免得一枚 chip 撑满摘要行', () => {
    const nos = item({ component: 'Select', componentProps: { mode: 'tags' } });

    expect(chipTextOf(nos, ['A', 'B', 'C'])).toBe('A, B, C');
    expect(chipTextOf(nos, ['A', 'B', 'C', 'D'])).toBe('A, B 等 4 项');
  });

  it('多值也走选项文案映射', () => {
    const sign = item({
      component: 'Select',
      componentProps: {
        mode: 'multiple',
        options: [
          { label: '蓝票', value: 'BLUE' },
          { label: '红票', value: 'RED' },
        ],
      },
    });

    expect(chipTextOf(sign, ['BLUE', 'RED'])).toBe('蓝票, 红票');
  });

  it('单个日期按格式串显示', () => {
    expect(chipTextOf(item({ component: 'DatePicker' }), dayjs('2026-08-25'))).toBe('2026-08-25');
  });
});
