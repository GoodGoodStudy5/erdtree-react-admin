import type { Breakpoint } from 'antd';
import { DEFAULT_COLUMN_NUM } from './context';
import type { RowLayoutColumnNum } from './types';

/** 栅格总列数 */
const GRID_SPAN = 24;
/** 中屏 (md/lg) 的保底列宽. 真列宽再窄也不用: 一行挤进太多字段, 谁都看不清 */
const MEDIUM_MIN_SPAN = 8;

/**
 * 本库下发的断点档, 由窄到宽. 更宽的档 (xxl 起) 不下发 —— antd 的 Col 只为给了值的档生成类,
 * 于是那些视口沿用 xl.
 */
const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/** Col 的跨度上限是 24 格 */
function limitSpan(span: number) {
  return Math.min(GRID_SPAN, span);
}

/** 单列在某一档下占几格. 断点策略只此一处, 下面两个消费者都读它 */
function unitSpanAt(breakpoint: (typeof BREAKPOINTS)[number], baseSpan: number) {
  switch (breakpoint) {
    case 'xs':
      return GRID_SPAN;
    case 'sm':
      return GRID_SPAN / 2;
    case 'md':
    case 'lg':
      return Math.max(baseSpan, MEDIUM_MIN_SPAN);
    default:
      return baseSpan;
  }
}

/**
 * 按列数与所占列格算出全套断点.
 * @param colSize - 占几列
 * @param columnNum - 一行几列
 */
export function breakpointsOf(colSize: number, columnNum: RowLayoutColumnNum) {
  const baseSpan = GRID_SPAN / columnNum;
  const spans = {} as Record<(typeof BREAKPOINTS)[number], number>;

  BREAKPOINTS.forEach((breakpoint) => {
    spans[breakpoint] = limitSpan(colSize * unitSpanAt(breakpoint, baseSpan));
  });

  return spans;
}

/**
 * 当前视口下一行实际排几列.
 *
 * 按行数做事的调用方 (如按行收放的搜索栏) 从这里问, 不在外面照断点表抄一份 —— 抄了就是第二处
 * 版式来源, 本库改断点时那份会静默失准, 而它算错只表现为"少露了一行", 没人会当场发现.
 * @param columnNum - 声明的列数, 与 RowLayout 同一个默认值
 * @param screens - antd `Grid.useBreakpoint()` 的结果; 一档都没命中 (首帧还没订阅上) 时按最宽那档答
 */
export function columnCountAt(
  columnNum: RowLayoutColumnNum = DEFAULT_COLUMN_NUM,
  screens: Partial<Record<Breakpoint, boolean>> = {},
) {
  const baseSpan = GRID_SPAN / columnNum;
  // 取命中的最宽一档: 除 xs 外都是 min-width 查询, 宽档的类写在后面, 盖住窄档
  const active = [...BREAKPOINTS].reverse().find((breakpoint) => screens[breakpoint]) ?? 'xl';

  return GRID_SPAN / unitSpanAt(active, baseSpan);
}
