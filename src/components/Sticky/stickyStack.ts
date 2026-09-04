/** 一员的排布结果 */
export interface StickyPlan {
  /** 退让距离: 栈内排在它前面的成员高度之和 */
  offset: number;
  /** 层级序: 排在前面的数值更大, 于是后一员补的底色被前一员挡住 */
  order: number;
}

/**
 * 算一条吸附栈的排布.
 *
 * 只吃高度不吃位置: 成员在文档流里的坐标测不准 —— 已经贴住的成员被顶到哪, 各家浏览器在
 * offsetTop 上的口径并不一致, 拿它当输入会让退让距离越滚越大.
 *
 * 入参按吸附的先后给: 吸顶栈是文档顺序, 吸底栈要倒过来 —— 底边先贴住的是文档里的最后一员.
 * @param heights - 各成员撑起的高度, 按吸附先后排列
 */
export function planStickyStack(heights: number[]): StickyPlan[] {
  let stacked = 0;

  return heights.map((height, index) => {
    const plan: StickyPlan = { offset: stacked, order: heights.length - index };

    stacked += height;

    return plan;
  });
}
