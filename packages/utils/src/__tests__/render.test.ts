import { describe, expect, it, vi } from 'vitest';
// 用例站在包外看这个工具库, 所以从门面取件, 不走深层路径
import { eR, emptyRender, emptyRenderArray, emptyRenderArrayJoin } from '@south/utils';

describe('emptyRender', () => {
  it('空串、null、undefined 三种算空, 渲染成 -', () => {
    expect(emptyRender('')).toBe('-');
    expect(emptyRender(null)).toBe('-');
    expect(emptyRender(undefined)).toBe('-');
  });

  it('0 与 false 不算空, 原样交出', () => {
    expect(emptyRender(0)).toBe(0);
    expect(emptyRender(false)).toBe(false);
  });

  it('给了 render 则由它接管非空值', () => {
    expect(emptyRender('a', (item) => `[${item}]`)).toBe('[a]');
  });

  it('空值不进 render', () => {
    const render = vi.fn((item: string) => item);

    expect(emptyRender('', render)).toBe('-');
    expect(render).not.toHaveBeenCalled();
  });

  it('eR 是 emptyRender 的别名, 同一个函数', () => {
    expect(eR).toBe(emptyRender);
  });
});

describe('emptyRenderArray', () => {
  it('有项则逐项映射', () => {
    expect(emptyRenderArray(['a', 'b'], (item) => `[${item}]`)).toEqual(['[a]', '[b]']);
  });

  it('空数组与空值都渲染成 -', () => {
    const map = vi.fn((item: string) => item);

    expect(emptyRenderArray([], map)).toBe('-');
    expect(emptyRenderArray(null, map)).toBe('-');
    expect(emptyRenderArray(undefined, map)).toBe('-');
    expect(map).not.toHaveBeenCalled();
  });
});

describe('emptyRenderArrayJoin', () => {
  it('拼接前先剔掉空项', () => {
    expect(emptyRenderArrayJoin(['a', '', 'b', null, undefined], ',')).toBe('a,b');
  });

  it('0 不算空项, 参与拼接', () => {
    expect(emptyRenderArrayJoin([0, 1], '/')).toBe('0/1');
  });

  it('剔完没剩下、空数组、空值都渲染成 -', () => {
    expect(emptyRenderArrayJoin(['', null, undefined], ',')).toBe('-');
    expect(emptyRenderArrayJoin([], ',')).toBe('-');
    expect(emptyRenderArrayJoin(null, ',')).toBe('-');
    expect(emptyRenderArrayJoin(undefined, ',')).toBe('-');
  });
});
