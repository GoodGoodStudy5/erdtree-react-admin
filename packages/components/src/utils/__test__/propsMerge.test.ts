import { describe, expect, it, vi } from 'vitest';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { propsMerge } from '@south/components';

describe('propsMerge', () => {
  it('外部同名键盖掉内部默认值', () => {
    const merged = propsMerge({ placeholder: '请选择', allowClear: true }, { allowClear: false });

    expect(merged.placeholder).toBe('请选择');
    expect(merged.allowClear).toBe(false);
  });

  it('className 是例外: 两边拼接而不是覆盖', () => {
    const merged = propsMerge({ className: 'load-button' }, { className: 'my-btn' });

    expect(merged.className).toBe('load-button my-btn');
  });

  it('两边都没 className 时不留空串', () => {
    expect(propsMerge({ size: 'small' }, undefined).className).toBeUndefined();
  });

  it('fnObjs 的内部行为先跑, 外部同名回调照样被调用, 不被替换', () => {
    const calls: string[] = [];
    const outer = vi.fn(() => {
      calls.push('outer');
      return 'outer-result';
    });
    const inner = vi.fn(() => {
      calls.push('inner');
    });
    const merged = propsMerge({}, { onSearch: outer }, { onSearch: inner });
    const result = (merged.onSearch as (keyword: string) => unknown)('key');

    expect(calls).toEqual(['inner', 'outer']);
    expect(inner).toHaveBeenCalledExactlyOnceWith('key');
    expect(outer).toHaveBeenCalledExactlyOnceWith('key');
    // 交出去的是外部回调的返回值: 合成不改变调用方看到的结果
    expect(result).toBe('outer-result');
  });

  it('内部只有行为、外部没传回调时也能调用', () => {
    const inner = vi.fn();
    const merged = propsMerge({}, {}, { onFocus: inner });

    expect((merged.onFocus as () => unknown)()).toBeUndefined();
    expect(inner).toHaveBeenCalledOnce();
  });

  it('fnObjs 给 false 表示本次不要内部行为, 外部回调原样生效', () => {
    const outer = vi.fn(() => 'outer-result');
    const merged = propsMerge({}, { onSearch: outer }, { onSearch: false });

    expect(merged.onSearch).toBe(outer);
    expect((merged.onSearch as () => unknown)()).toBe('outer-result');
  });
});
