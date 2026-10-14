import type { Dayjs } from 'dayjs';
import type { DatePickerProps } from 'antd';
import type { BaseFormData, BaseFormList } from '#/form';
import { DATE_FORMAT, TIME_PICKER_FORMAT } from '@/utils';
import dayjs from 'dayjs';

/**
 * @description isDayjs必须使用dayjs.isDayjs形式，否则打包会失败
 */

// 区间值
type EventValue<T> = T | null;
/** 日期区间值, 两端各自允许为空 */
export type RangeValue<T> = [EventValue<T>, EventValue<T>] | null;

/**
 * Dayjs 转字符串; 其余原样返回. 空值不会变成现在.
 */
export function dayjs2String<T>(value: T, format = DATE_FORMAT) {
  if (dayjs.isDayjs(value)) {
    return value.format(format);
  }
  return value;
}

/**
 * 认得出的转 Dayjs; 其余 undefined. 不能丢给 dayjs(value), undefined 会变成现在.
 */
export function string2Dayjs(value: Dayjs | string | number | Date): Dayjs;
export function string2Dayjs(value: unknown): Dayjs | undefined;
export function string2Dayjs(value: unknown): Dayjs | undefined {
  if (dayjs.isDayjs(value)) return value;
  if (value instanceof Date) return dayjs(value);
  if (typeof value === 'number' && isFinite(value)) return dayjs.unix(value);
  if (typeof value === 'string') return dayjs(value);
}

/** 空端保持空, 不丢给 dayjs: null / undefined 会变成现在. */
function end2Dayjs(value: unknown): Dayjs | null {
  if (value === null || value === undefined || value === '') return null;
  return string2Dayjs(value) ?? null;
}

function end2String(value: unknown, format: string): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'string') return value;
  const date = string2Dayjs(value);
  return date ? date.format(format) : undefined;
}

/**
 * 区间转字符串. 两端各自可空, 空端是 undefined 不是现在.
 */
export function dayjsRang2StringRang(
  value?: [unknown, unknown] | null,
  format = DATE_FORMAT,
): [string | undefined, string | undefined] | undefined {
  if (!value) return undefined;
  const from = end2String(value[0], format);
  const to = end2String(value[1], format);
  if (from === undefined && to === undefined) return undefined;
  return [from, to];
}

/**
 * 区间转 Dayjs. 两端各自可空, 空端是 null 不是现在.
 */
export function stringRang2DayjsRang(
  value?: [unknown, unknown] | null,
): RangeValue<Dayjs> | undefined {
  if (!value) return undefined;
  return [end2Dayjs(value[0]), end2Dayjs(value[1])];
}

/**
 * 获取列表中改键值数据
 * @param list - 列表值
 * @param key - 键值
 */
function getListKeyParam(list: BaseFormList[], key: string): string {
  for (let i = 0; i < list.length; i++) {
    if (list[i].name === key) {
      let format = DATE_FORMAT; // 默认日期选择器格式
      // 时间选择器则为HH:mm:ss
      if (['TimePicker', 'TimeRangePicker'].includes(list[i].component)) {
        format = TIME_PICKER_FORMAT;
      }
      // 有格式化数据则用格式化数据
      if ((list[i].componentProps as DatePickerProps)?.format) {
        format = (list[i].componentProps as DatePickerProps)?.format as string;
      }

      return format;
    }
  }

  return DATE_FORMAT;
}

/**
 * 将Dayjs转为字符串
 * @param obj - 检测对象
 * @param list - 列表值
 */
export function filterDayjs(obj: BaseFormData, list: BaseFormList[]): Record<string, unknown> {
  // 获取自定义组件的key
  const customizeList = list
    .filter((item) => item.component === 'customize')
    .map((item) => item.name);

  for (const key in obj) {
    // 自定义组件不处理
    if (customizeList?.includes(key)) continue;

    // 判断是否是时间区间
    if (
      (obj[key] as [Dayjs, Dayjs])?.length === 2 &&
      dayjs.isDayjs((obj[key] as [Dayjs, Dayjs])[0]) &&
      dayjs.isDayjs((obj[key] as [Dayjs, Dayjs])[1])
    ) {
      const format = getListKeyParam(list, key);
      obj[key] = dayjsRang2StringRang(obj[key] as [Dayjs, Dayjs], format);
    }

    // 如果是Dayjs类型则转换成字符串
    if (obj?.[key] && dayjs.isDayjs(obj[key])) {
      const format = getListKeyParam(list, key);
      obj[key] = dayjs2String(obj[key] as Dayjs, format);
    }
  }

  return obj;
}
