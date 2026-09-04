import { describe, expect, it } from 'vitest';
import { countBeyond, planRows } from '../rowPlan';

describe('planRows', () => {
  it('等宽字段按列数逐行放置', () => {
    const plan = planRows([1, 1, 1, 1, 1], 2);

    expect(plan.rows).toEqual([1, 1, 2, 2, 3]);
    expect(plan.total).toBe(3);
  });

  it('占两格的字段在行尾放不下时整行换行, 于是行数多过除法算出来的', () => {
    // 5 格内容在 2 列下按除法是 3 行, 但第 2 项占两格, 挤不进第一行的剩余一格
    const plan = planRows([1, 2, 1, 1], 2);

    expect(plan.rows).toEqual([1, 2, 3, 3]);
    // 换行让第一行留了一格空
    expect(plan.total).toBe(3);
  });

  it('占的列数超过一行总列数时只占满一行', () => {
    const plan = planRows([2, 1], 1);

    expect(plan.rows).toEqual([1, 2]);
  });

  it('没有搜索项时零行', () => {
    expect(planRows([], 4)).toEqual({ rows: [], total: 0 });
  });

  it('列数非法时按一列算, 不返回 Infinity 或 NaN', () => {
    expect(planRows([1, 1], 0).total).toBe(2);
  });
});

describe('countBeyond', () => {
  it('数的是被折叠掉的条件数, 不是行数', () => {
    const plan = planRows([1, 1, 1, 1, 1], 2);

    expect(countBeyond(plan, 1)).toBe(3);
    expect(countBeyond(plan, 2)).toBe(1);
  });

  it('露的行数够用时没有条件被折叠', () => {
    const plan = planRows([1, 1], 2);

    expect(countBeyond(plan, 1)).toBe(0);
    expect(countBeyond(plan, 9)).toBe(0);
  });
});
