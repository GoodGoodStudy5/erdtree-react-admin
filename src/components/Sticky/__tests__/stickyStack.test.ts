import { describe, expect, it } from 'vitest';
import { planStickyStack } from '../stickyStack';

describe('planStickyStack', () => {
  it('退让距离是前面成员的高度之和, 不含自己', () => {
    expect(planStickyStack([56, 42, 38]).map((one) => one.offset)).toEqual([0, 56, 98]);
  });

  it('首员不退让', () => {
    expect(planStickyStack([56]).map((one) => one.offset)).toEqual([0]);
  });

  it('层级序按吸附先后递减, 于是后一员补的底色被前一员挡住', () => {
    expect(planStickyStack([10, 10, 10]).map((one) => one.order)).toEqual([3, 2, 1]);
  });

  it('高度为零的成员不占退让距离, 也照样排上层级序', () => {
    const plans = planStickyStack([56, 0, 38]);

    expect(plans.map((one) => one.offset)).toEqual([0, 56, 56]);
    expect(plans.map((one) => one.order)).toEqual([3, 2, 1]);
  });

  it('空栈不返回成员', () => {
    expect(planStickyStack([])).toEqual([]);
  });
});
