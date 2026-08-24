/** 被 promiseCacheApi / promisePolling 包装的请求函数 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 形参改 unknown[] 后, (id: string) => Promise<T> 因逆变检查不再满足约束, 具名形参的请求函数一律推不进来
type AsyncFunc = (...args: any[]) => Promise<unknown>;

/**
 * 缓存请求结果, 用于枚举、字典这类同一入参反复取同一份数据的接口.
 *
 * 缓存的是 Promise 而不是结果: 并发调用因此共享同一个在途请求. 若等成功再缓存,
 * 一次并发仍会向后端发起多个请求, 去重就落空了.
 *
 * 失败即驱逐缓存, 下次调用重新发起; 给了 expired 则成功后再过 expired 毫秒驱逐.
 *
 * 已知边界: 缓存键是 `JSON.stringify(args)`, 对象入参的键顺序不同会被当成两次不同调用;
 * 函数、Symbol、循环引用这类不可序列化的入参会在键上失真, 不同调用可能撞成同一份缓存.
 *
 * @param call - 被缓存的请求函数. 类型推导结果不对时给它加 async 辅助推导
 * @param options - expired 为结果过期毫秒数, 默认不过期
 */
export function promiseCacheApi<T extends AsyncFunc>(
  call: T,
  {
    expired,
  }: {
    /** 结果过期时间, setTimeout 操作, 默认不过期 */
    expired?: number;
  } = {},
) {
  const cacheMap: Record<string, Promise<unknown> | undefined> = {};

  return function (...args: Parameters<T>) {
    const cacheKey = args.length > 0 ? JSON.stringify(args) : '_default';
    const cached = cacheMap[cacheKey];

    if (cached !== undefined) {
      return cached;
    }
    const req = call(...args);

    cacheMap[cacheKey] = req;
    // 成败两支写在同一个 then 里: 分成 .then 与 .catch 两条会派生出无人处理的 rejected Promise
    req.then(
      () => {
        if (expired) {
          setTimeout(() => {
            cacheMap[cacheKey] = undefined;
          }, expired);
        }
      },
      () => {
        cacheMap[cacheKey] = undefined;
      },
    );
    return req;
  } as (...args: Parameters<T>) => ReturnType<T>;
}

/** 轮询的续与收口. 由 promisePolling 交给 callback, 调用方在其中决定再来一轮还是结束 */
export interface PollingNext<R> {
  /** 再来一轮. 不传参数则复用上一次的参数. 它只负责排下一轮, 返回值不代表那一轮的结果 */
  (...args: unknown[]): void;
  /** 收口: 整条轮询以 value 成功 */
  resolve: (value: R) => void;
  /** 收口: 整条轮询以 reason 失败 */
  reject: (reason?: unknown) => void;
}

/**
 * Promise 轮询. 把「隔多久再问一次、失败重试几次、什么时候算完」收进一个状态机,
 * 调用方只在 callback 里按业务判据决定 next 还是 resolve.
 *
 * 已知边界:
 * - callback 既不调 next 也不调 resolve 时, 返回的 Promise 永远 pending, 不会超时
 * - 返回的轮询器是一次性的: 失败计数、上次参数、resolve / reject 都挂在这一次包装上.
 *   再调一次会继承上次的失败计数并劫持上次的 resolve / reject, 前一条轮询于是永远 pending.
 *   无论并发还是先后复用, 都请重新 promisePolling 包一个
 * - retry 是累计失败次数, 成功不重置: 计数按每次 promisePolling 算, 不按单轮算
 * - 重试途中的失败只用于累加计数, err 本身被丢弃, 最终 reject 交出的是末次那个
 *
 * @param asyncFunc - 每轮发起的请求
 * @param callback - 拿到结果后决定去向: 调 next 再来一轮, 调 next.resolve / next.reject 收口
 * @param options - step 为轮询步长 (默认 1s, 在上一轮完成后起算, 故实际间隔是 max(请求耗时, step));
 *                  retry 为累计失败上限, 不给则首次失败即 reject
 */
export function promisePolling<T extends AsyncFunc, R = Awaited<ReturnType<T>>>(
  asyncFunc: T,
  callback: (params: { result: R; next: PollingNext<R> }) => void,
  options: {
    /** 轮询步长, 在上一个请求完成之后调用 callback, 默认 1s, 最短间隔 max(asyncFunc, step) */
    step?: number;
    /** 累计失败上限, 失败 retry 次后停止 */
    retry?: number;
  } = {},
) {
  const { step = 1000, retry } = options;
  let countCatch = 0;
  let params = [] as unknown as Parameters<T>;

  const next = function (...args: unknown[]) {
    if (args.length !== 0) {
      params = args as Parameters<T>;
    }
    const res = asyncFunc(...params) as Promise<R>;

    setTimeout(() => {
      // 成败两支写在同一个 then 里: 分成 .then 与 .catch 两条会派生出无人处理的 rejected Promise
      res.then(
        (result) => {
          try {
            callback({ result, next });
          } catch (err) {
            next.reject(err);
          }
        },
        (err) => {
          countCatch += 1;
          if (retry === undefined || countCatch >= retry) {
            next.reject(err);
            return;
          }
          next();
        },
      );
    }, step);
  } as PollingNext<R>;

  return function (...args: Parameters<T>) {
    return new Promise<R>((resolve, reject) => {
      next.resolve = resolve;
      next.reject = reject;
      next(...args);
    });
  };
}
