import type { BaseSearchList } from '#/form';
import type { SelectProps } from 'antd';
import dayjs from 'dayjs';
// 显式引而不靠自动导入: 用例跑在没有那个插件的环境里, 靠自动导入的值在测试中是 undefined
import { DATE_FORMAT } from '@/utils';
import { isBlank } from './formValue';

/** 一枚 chip 的文案拆解 */
export interface ChipParts {
  /** 每个值一条, 码值已换成选项文案. 区间算一条 —— 一格装两端 */
  items: string[];
  /** 多值控件才给计数: 单值出「1 项」是废话 */
  isMulti: boolean;
}

/**
 * 单值的那档: 没有计数可言.
 * @param text - 已成文的值
 */
function single(text: string): ChipParts {
  return { items: [text], isMulti: false };
}

/** 取控件的格式串. RangePicker 给的是两端各一份, 取第一份 */
function formatOf(item: BaseSearchList) {
  const { format } = (item.componentProps ?? {}) as { format?: unknown };
  const single = Array.isArray(format) ? format[0] : format;

  return typeof single === 'string' ? single : DATE_FORMAT;
}

/**
 * 码值换成选项文案. 选项的 label 是 ReactNode, 只有字符串才拿得来当 chip 文案,
 * 其余 (自定义渲染的选项) 退回码值 —— 摘要是纯文本, 不承载渲染.
 */
function labelOf(item: BaseSearchList, value: unknown) {
  const { options } = (item.componentProps ?? {}) as Pick<SelectProps, 'options'>;
  const hit = options?.find((option) => option.value === value);

  return typeof hit?.label === 'string' ? hit.label : String(value);
}

/** 一端缺失的数值区间写成不等式: 写成 `1000 ~ ` 会让人以为另一端是 0 */
function numberRangeText(low: unknown, high: unknown) {
  if (isBlank(low)) return `≤ ${String(high)}`;
  if (isBlank(high)) return `≥ ${String(low)}`;

  return `${String(low)} ~ ${String(high)}`;
}

/**
 * 一个已填条件在摘要上的拆解; 未填返回 null.
 *
 * **值与计数分开交**: 摘要里装不下的是值那一段, 而「选了几项」是这枚 chip 唯一不可丢的信息 ——
 * 拼成一句话的话计数排在末尾, 正好落在省略号之后, 于是看得见半个公司名却看不见 4 这个数.
 * 由此也不再有「最多列几个」的阈值: 列全部, 装得下多少由 CSS 定.
 *
 * 值的形状按 component 与实际内容判, 不另立声明字段: 搜索项的数据结构归接口票, 本组件先不动它.
 * 已知边界: 恰好两项且都是数字的多选 (tags 模式) 会被当成数值区间显示成 `a ~ b`.
 * @param item - 搜索项
 * @param value - 表单里这一项的当前值
 */
export function chipPartsOf(item: BaseSearchList, value: unknown): ChipParts | null {
  if (isBlank(value)) return null;

  if (dayjs.isDayjs(value)) return single(value.format(formatOf(item)));

  if (typeof value === 'boolean') return single(value ? '是' : '否');

  if (Array.isArray(value)) {
    const filled = value.filter((one) => !isBlank(one));

    if (!filled.length) return null;

    // 区间控件两端各一个值, 缺的那端留成空位, 所以按原长度判而不是按去空后的长度
    if (value.length === 2) {
      if (filled.every((one) => dayjs.isDayjs(one))) {
        const [start, end] = value as [unknown, unknown];
        const text = (one: unknown) => (dayjs.isDayjs(one) ? one.format(formatOf(item)) : '不限');

        return single(`${text(start)} ~ ${text(end)}`);
      }
      if (filled.every((one) => typeof one === 'number')) {
        return single(numberRangeText(value[0], value[1]));
      }
    }

    return { items: filled.map((one) => labelOf(item, one)), isMulti: true };
  }

  return single(labelOf(item, value));
}
