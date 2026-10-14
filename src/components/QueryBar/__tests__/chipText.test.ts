import type { ChipParts } from '../chipText';
import type { BaseSearchList } from '#/form';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { chipPartsOf } from '../chipText';

/** 造一个搜索项: 摘要只读 name 之外的展示口径, 所以用例只给用得上的那几个键 */
function item(partial: Partial<BaseSearchList> = {}): BaseSearchList {
  return { name: 'field', label: '字段', component: 'Input', ...partial };
}

/**
 * 把拆解压成一行好断言, 读法与摘要上一致: 多值末尾带项数, 单值没有计数可言.
 *
 * 值与计数在组件里是两个元素 (中间那个才截断), 这里拼回一起只为用例读得顺.
 * @param parts - 拆解结果
 */
function textOf(parts: ChipParts | null) {
  if (!parts) return null;

  return parts.isMulti ? `${parts.items.join(', ')} ${parts.items.length} 项` : parts.items[0];
}

describe('chipPartsOf', () => {
  it('空值不成 chip: 摘要只放已填的条件', () => {
    expect(textOf(chipPartsOf(item(), undefined))).toBeNull();
    expect(textOf(chipPartsOf(item(), null))).toBeNull();
    expect(textOf(chipPartsOf(item(), ''))).toBeNull();
    expect(textOf(chipPartsOf(item(), []))).toBeNull();
    expect(textOf(chipPartsOf(item(), [undefined, undefined]))).toBeNull();
  });

  it('0 与 false 是填了: 它们是值, 不是空', () => {
    expect(textOf(chipPartsOf(item({ component: 'InputNumber' }), 0))).toBe('0');
    expect(textOf(chipPartsOf(item({ component: 'Switch' }), false))).toBe('否');
    expect(textOf(chipPartsOf(item({ component: 'Switch' }), true))).toBe('是');
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

    expect(textOf(chipPartsOf(kind, 'SPECIAL'))).toBe('增值税专用发票');
    // 选项里没有的码值原样显示, 不吞掉
    expect(textOf(chipPartsOf(kind, 'UNKNOWN'))).toBe('UNKNOWN');
  });

  it('日期区间按控件的格式串显示两端', () => {
    const range = item({ component: 'RangePicker' });
    const value = [dayjs('2026-08-01'), dayjs('2026-08-31')];

    expect(textOf(chipPartsOf(range, value))).toBe('2026-08-01 ~ 2026-08-31');
  });

  it('日期控件出门的是 string: 区间照样读成两端, 缺的那端读不限', () => {
    const range = item({ component: 'RangePicker' });

    expect(textOf(chipPartsOf(range, ['2026-08-01', '2026-08-31']))).toBe(
      '2026-08-01 ~ 2026-08-31',
    );
    expect(textOf(chipPartsOf(range, [null, '2026-08-31']))).toBe('不限 ~ 2026-08-31');
    expect(chipPartsOf(range, ['2026-08-01', '2026-08-31'])?.isMulti).toBe(false);
    expect(
      textOf(chipPartsOf(item({ component: 'TimeRangePicker' }), ['08:00:00', '18:00:00'])),
    ).toBe('08:00:00 ~ 18:00:00');
  });

  it('两个 string 的多选不误认成区间: 按控件判, 不按值的形状猜', () => {
    const nos = item({ component: 'Select', componentProps: { mode: 'tags' } });

    expect(textOf(chipPartsOf(nos, ['A', 'B']))).toBe('A, B 2 项');
  });

  it('数值区间缺一端时写成不等式, 不把缺的那端说成 0', () => {
    const money = item({ component: 'customize' });

    expect(textOf(chipPartsOf(money, [1000, 2000]))).toBe('1000 ~ 2000');
    expect(textOf(chipPartsOf(money, [1000, undefined]))).toBe('≥ 1000');
    expect(textOf(chipPartsOf(money, [undefined, 2000]))).toBe('≤ 2000');
  });

  it('多值列全部再带项数: 列几个不由项数定, 装得下多少由 CSS 定', () => {
    const nos = item({ component: 'Select', componentProps: { mode: 'tags' } });

    expect(textOf(chipPartsOf(nos, ['A', 'B', 'C']))).toBe('A, B, C 3 项');
    expect(textOf(chipPartsOf(nos, ['A', 'B', 'C', 'D']))).toBe('A, B, C, D 4 项');
  });

  it('区间不算多值: 一格装两端, 出「2 项」会读成筛了两个值', () => {
    expect(chipPartsOf(item({ component: 'customize' }), [1000, 2000])?.isMulti).toBe(false);
    expect(chipPartsOf(item({ component: 'RangePicker' }), [dayjs(), dayjs()])?.isMulti).toBe(
      false,
    );
    expect(chipPartsOf(item({ component: 'Select' }), 'SPECIAL')?.isMulti).toBe(false);
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

    expect(textOf(chipPartsOf(sign, ['BLUE', 'RED']))).toBe('蓝票, 红票 2 项');
  });

  it('单个日期按格式串显示', () => {
    expect(textOf(chipPartsOf(item({ component: 'DatePicker' }), dayjs('2026-08-25')))).toBe(
      '2026-08-25',
    );
    expect(textOf(chipPartsOf(item({ component: 'DatePicker' }), '2026-08-25'))).toBe('2026-08-25');
  });
});
