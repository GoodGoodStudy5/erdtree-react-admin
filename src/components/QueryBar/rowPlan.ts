/** 搜索项在栅格里的落行结果 */
export interface RowPlan {
  /** 每项落在第几行, 从 1 起, 下标与传入的 colSizes 对齐 */
  rows: number[];
  /** 总行数 */
  total: number;
}

/**
 * 照栅格的逐行放置模拟出每项落在第几行.
 *
 * 不能用 `ceil(总格数 / 列数)`: 占两格的字段在行尾放不下时整行换行并留一格空 (flex 换行的定义),
 * 于是真实行数会比除法多. 露几行是按像素限高的, 行数算多算少都直接表现为切错位置.
 * @param colSizes - 每项占几列, 与搜索项一一对应
 * @param columnCount - 当前断点下一行排几列
 */
export function planRows(colSizes: number[], columnCount: number): RowPlan {
  // 列数兜底成 1: 上游算出 0 或负数时宁可排成一列, 也不让下面的除法漏出 Infinity
  const capacity = Math.max(1, Math.floor(columnCount));
  const rows: number[] = [];
  let current = 0;
  let used = 0;

  colSizes.forEach((colSize) => {
    // 占的列数超过一行总列数时只占满一行, 与 RowLayout 把 span 卡在 24 格是同一件事
    const size = Math.min(Math.max(1, colSize), capacity);

    if (current === 0 || used + size > capacity) {
      current += 1;
      used = size;
    } else {
      used += size;
    }
    rows.push(current);
  });

  return { rows, total: current };
}

/**
 * 只露 visibleRows 行时被折叠掉的条件数.
 *
 * 数条件不数行: 读者关心的是"还有几个条件没看见", 而一行几个条件随断点变.
 * @param plan - 落行结果
 * @param visibleRows - 露几行
 */
export function countBeyond(plan: RowPlan, visibleRows: number) {
  return plan.rows.filter((row) => row > visibleRows).length;
}
