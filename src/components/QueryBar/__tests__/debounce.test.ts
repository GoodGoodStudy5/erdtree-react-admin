import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { leadingDebounce } from '../debounce';

describe('leadingDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('第一下立刻走, 不等窗口', () => {
    const fn = vi.fn();

    leadingDebounce(fn, 300).call();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('只调一次时不补尾部 —— 补了的话下拉选一次会提交两次', () => {
    const fn = vi.fn();

    leadingDebounce(fn, 300).call();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('窗口里连着调只合成一次尾部', () => {
    const fn = vi.fn();
    const debounced = leadingDebounce(fn, 300);

    // 前沿那一下
    debounced.call();
    // 后面三下都落在窗口里, 每一下都把窗口往后推
    debounced.call();
    vi.advanceTimersByTime(100);
    debounced.call();
    vi.advanceTimersByTime(100);
    debounced.call();
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('隔开窗口的两下各自立刻走', () => {
    const fn = vi.fn();
    const debounced = leadingDebounce(fn, 300);

    debounced.call();
    vi.advanceTimersByTime(500);
    debounced.call();
    expect(fn).toHaveBeenCalledTimes(2);

    // 第二下同样不补尾部
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('取消之后等着的那一拍不再走', () => {
    const fn = vi.fn();
    const debounced = leadingDebounce(fn, 300);

    debounced.call();
    debounced.call();
    debounced.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
