import { createContext } from 'react';
import type { RowLayoutColumnNum } from './types';

/** 列数默认值. RowLayout 的默认值与 context 的初始值都取它, 不许两处各写一个 3 */
export const DEFAULT_COLUMN_NUM: RowLayoutColumnNum = 3;

/** RowInner 靠它继承父级列数: 条件成组渲染不该让调用方再抄一遍 columnNum */
export const RowLayoutContext = createContext<{ columnNum: RowLayoutColumnNum }>({
  columnNum: DEFAULT_COLUMN_NUM,
});
