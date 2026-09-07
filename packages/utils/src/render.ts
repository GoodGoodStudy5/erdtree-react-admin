import type { ReactNode } from 'react';
import { includesInArray } from './array';

/** 全站空值的统一显示 */
export const emptyText = '-' as const;

/**
 * 算作空的取值. 只此三个 —— 0 与 false 不在内: 数量为 0、开关为关都是有效值, 显示成 "-" 会丢信息.
 *
 * 口径只此一份, emptyRender 与 emptyRenderArrayJoin 共用, 免得两处各自漂移.
 */
const EMPTY_VALUES = ['', undefined, null] as const;

/**
 * 表格列的空值口径: 空串、null、undefined 一律显示 "-", 其余交给 render.
 *
 * @param value - 待渲染的值
 * @param render - 非空时的渲染函数, 不给则原样交出
 */
export function emptyRender<T>(value: T | null | undefined, render?: (item: T) => ReactNode) {
  return includesInArray(EMPTY_VALUES, value) ? emptyText : render ? render(value) : value;
}

/** emptyRender 的短名. 表格列的 render 里高频出现, 长名会把一行撑开 */
export const eR = emptyRender;

/**
 * 数组的空值口径: 没有项时显示 "-", 否则逐项映射.
 *
 * @param arr - 待渲染的数组
 * @param map - 逐项渲染函数
 */
export function emptyRenderArray<T>(
  arr: T[] | null | undefined,
  map: (item: T, i: number, arr: T[]) => ReactNode,
) {
  return arr && arr.length > 0 ? arr.map(map) : emptyText;
}

/**
 * 数组拼成一行显示. 先按 emptyRender 的口径剔掉空项, 剔完没剩下则显示 "-".
 *
 * @param arr - 待拼接的数组
 * @param joinStr - 分隔符
 */
export function emptyRenderArrayJoin<T>(arr: T[] | null | undefined, joinStr: string) {
  const validArr = (arr || []).filter((item) => includesInArray(EMPTY_VALUES, item) === false);

  return validArr.length > 0 ? validArr.join(joinStr) : emptyText;
}
