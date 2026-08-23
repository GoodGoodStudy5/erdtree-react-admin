import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { useRequest } from '@south/components';

/** 让请求有可控的先后到达顺序 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('useRequest', () => {
  it('连续请求只有最后一次落地, 早发晚到的响应作废', async () => {
    const service = vi.fn(async (keyword: string) => {
      await sleep(keyword === 'slow' ? 40 : 5);
      return keyword;
    });
    const { result } = renderHook(() => useRequest(service, { manual: true }));

    await act(async () => {
      // 先发的慢请求后到; 它不该盖掉后发快请求的结果
      const slow = result.current.runAsync('slow');
      const fast = result.current.runAsync('fast');

      await Promise.all([slow, fast]);
      await sleep(50);
    });

    expect(service).toHaveBeenCalledTimes(2);
    expect(result.current.data).toBe('fast');
    expect(result.current.loading).toBe(false);
  });

  it('防抖把连续触发合成一次, 只有最后一次入参生效', async () => {
    const service = vi.fn(async (keyword: string) => keyword);
    const { result } = renderHook(() => useRequest(service, { manual: true, debounceWait: 20 }));

    act(() => {
      result.current.run('a');
      result.current.run('ab');
      result.current.run('abc');
    });

    await waitFor(() => expect(result.current.data).toBe('abc'));
    expect(service).toHaveBeenCalledExactlyOnceWith('abc');
  });

  it('runAsync 不防抖: 要结果的调用方能当场等到它', async () => {
    const service = vi.fn(async (keyword: string) => keyword);
    const { result } = renderHook(() => useRequest(service, { manual: true, debounceWait: 20 }));

    await act(async () => {
      await expect(result.current.runAsync('now')).resolves.toBe('now');
    });

    expect(service).toHaveBeenCalledExactlyOnceWith('now');
  });

  it('异常原样上抛, 不吞', async () => {
    const error = new Error('接口炸了');
    const onError = vi.fn();
    const service = vi.fn(async () => {
      throw error;
    });
    const { result } = renderHook(() => useRequest(service, { manual: true, onError }));

    await act(async () => {
      await expect(result.current.runAsync()).rejects.toBe(error);
    });

    expect(onError).toHaveBeenCalledWith(error, []);
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it('非 manual 时挂载即请求一次', async () => {
    const service = vi.fn(async (id: string) => `detail-${id}`);
    const { result } = renderHook(() => useRequest(service, { defaultParams: ['7'] }));

    await waitFor(() => expect(result.current.data).toBe('detail-7'));
    expect(service).toHaveBeenCalledExactlyOnceWith('7');
  });
});
