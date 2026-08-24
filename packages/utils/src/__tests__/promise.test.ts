import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
// 用例站在包外看这个工具库, 所以从门面取件, 不走深层路径
import { promiseCacheApi, promisePolling } from '@south/utils';

// 缓存与轮询都是时序行为, 一律假计时: 真等会把用例时长绑在实现的间隔上
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** 延时 ms 后成功返回 value 的请求替身 */
function delayed<T>(value: T, ms = 3000) {
  return new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));
}

describe('promiseCacheApi', () => {
  it('并发调用拿到同一个 Promise 引用, 底层只发起一次', async () => {
    const spy = vi.fn();
    const api = promiseCacheApi(async (param?: string) => {
      spy();
      return delayed(param, 3000);
    });
    const a = api();
    const b = api();
    const c = api();

    expect(a).toBe(b);
    expect(b).toBe(c);

    await vi.advanceTimersByTimeAsync(3000);
    await expect(a).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('按入参分缓存: 同参共享, 异参各发一次', async () => {
    const spy = vi.fn();
    const api = promiseCacheApi(async (param?: string) => {
      spy();
      return delayed(param, 3000);
    });
    const a = api('a');
    const b = api('b');
    const c = api('a');

    expect(a).not.toBe(b);
    expect(a).toBe(c);

    await vi.advanceTimersByTimeAsync(3000);
    await expect(a).resolves.toBe('a');
    await expect(b).resolves.toBe('b');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('失败后缓存驱逐, 下次调用重新发起', async () => {
    const spy = vi.fn();
    const api = promiseCacheApi(async () => {
      spy();
      throw new Error('boom');
    });

    await expect(api()).rejects.toThrow('boom');
    await expect(api()).rejects.toThrow('boom');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('给了 expired 则到期驱逐, 计时从请求成功那刻起算', async () => {
    const spy = vi.fn();
    const api = promiseCacheApi(
      async () => {
        spy();
        return delayed('value', 100);
      },
      { expired: 1000 },
    );
    const first = api();

    await vi.advanceTimersByTimeAsync(100);
    await expect(first).resolves.toBe('value');

    // 请求成功后未到期, 仍走缓存
    await vi.advanceTimersByTimeAsync(999);
    expect(api()).toBe(first);
    expect(spy).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(1);
    expect(api()).not.toBe(first);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('promisePolling', () => {
  it('callback 里调 next.resolve 后整条链 resolve', async () => {
    const asyncFunc = vi.fn(async () => 'done');
    const polling = promisePolling(asyncFunc, ({ result, next }) => next.resolve(result), {
      step: 10,
    });
    const pending = polling();

    await vi.advanceTimersByTimeAsync(10);
    await expect(pending).resolves.toBe('done');
    expect(asyncFunc).toHaveBeenCalledOnce();
  });

  it('callback 里调 next 则继续轮询: 带参换参, 不带参复用上一轮的参数', async () => {
    const asyncFunc = vi.fn(async (id: string) => id);
    const seen: string[] = [];
    const polling = promisePolling(
      asyncFunc,
      ({ result, next }) => {
        seen.push(result);
        if (seen.length === 1) {
          next('task-2');
          return;
        }
        if (seen.length === 2) {
          // 不带参这一轮该拿 task-2 去问, 而不是退回最初的 task-1
          next();
          return;
        }
        next.resolve(result);
      },
      { step: 10 },
    );
    const pending = polling('task-1');

    await vi.advanceTimersByTimeAsync(30);
    await expect(pending).resolves.toBe('task-2');
    expect(asyncFunc.mock.calls).toEqual([['task-1'], ['task-2'], ['task-2']]);
  });

  it('retry 耗尽后整条链 reject', async () => {
    const asyncFunc = vi.fn(async () => {
      throw new Error('boom');
    });
    const polling = promisePolling(asyncFunc, () => undefined, { step: 10, retry: 2 });
    const rejected = expect(polling()).rejects.toThrow('boom');

    await vi.advanceTimersByTimeAsync(20);
    await rejected;
    expect(asyncFunc).toHaveBeenCalledTimes(2);
  });

  it('没给 retry 则首次失败即 reject', async () => {
    const asyncFunc = vi.fn(async () => {
      throw new Error('boom');
    });
    const polling = promisePolling(asyncFunc, () => undefined, { step: 10 });
    const rejected = expect(polling()).rejects.toThrow('boom');

    await vi.advanceTimersByTimeAsync(10);
    await rejected;
    expect(asyncFunc).toHaveBeenCalledOnce();
  });

  it('callback 抛异常时整条链 reject', async () => {
    const polling = promisePolling(
      async () => 'ok',
      () => {
        throw new Error('callback failed');
      },
      { step: 10 },
    );
    const rejected = expect(polling()).rejects.toThrow('callback failed');

    await vi.advanceTimersByTimeAsync(10);
    await rejected;
  });
});
