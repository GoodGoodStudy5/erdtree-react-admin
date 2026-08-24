import { useEffect, useRef, useState } from 'react';
import { useEvent } from './useEvent';

/** 请求函数. 入参由调用方定, 返回值决定 data 的类型 */
export type RequestService<TData, TParams extends unknown[]> = (
  ...params: TParams
) => Promise<TData>;

/** useRequest 的可选项. 接口对齐 ahooks v3 的同名子集, 换 ahooks 时调用点不必改 */
export interface UseRequestOptions<TData, TParams extends unknown[]> {
  /** true 则挂载时不自动请求, 全部由 run / runAsync 触发 */
  manual?: boolean;
  /**
   * 防抖毫秒数. 只作用于 run —— runAsync 是"我要这次结果"的入口, 防抖会让它无从等待,
   * 所以它始终立即发起.
   */
  debounceWait?: number;
  /** 成功回调. 只有最后一次发起的请求会走到这里, 旧响应静默作废 */
  onSuccess?: (data: TData, params: TParams) => void;
  /** 失败回调. 同样只认最后一次发起的请求 */
  onError?: (error: unknown, params: TParams) => void;
}

/** useRequest 的返回值. 成员是 ahooks v3 的子集, 只留组件真正用到的四个 */
export interface UseRequestResult<TData, TParams extends unknown[]> {
  /** 最后一次成功的响应 */
  data: TData | undefined;
  /** 是否有请求在飞. 被后发请求顶掉的旧请求不再影响它 */
  loading: boolean;
  /** 触发请求, 不返回结果. 设了 debounceWait 则防抖, 适合挂在高频事件上 */
  run: (...params: TParams) => void;
  /** 触发请求并等结果. 不防抖, 异常照原样抛给调用方 */
  runAsync: (...params: TParams) => Promise<TData>;
}

/**
 * 请求原语: 手动触发、防抖、竞态屏蔽、loading 四件事, 不做缓存/轮询/重试.
 *
 * 竞态屏蔽按发起顺序编号: 只有最后一次发起的请求可以落 data、翻 loading、走回调,
 * 早发晚到的响应整条作废. 连续搜索因此只会显示最后一次输入的结果.
 *
 * 异常不吞: runAsync 原样抛出, 由调用方决定怎么处理; onError 只是通知通道.
 *
 * 不直接从这里导入, 走 requestAdapter —— 换实现时那里改一行, 调用点一律不动.
 */
export function useRequest<TData, TParams extends unknown[]>(
  service: RequestService<TData, TParams>,
  options: UseRequestOptions<TData, TParams> = {},
): UseRequestResult<TData, TParams> {
  const { manual = false, debounceWait, onSuccess, onError } = options;
  const [data, setData] = useState<TData>();
  const [loading, setLoading] = useState(false);
  /** 发起序号. 每次发起自增, 响应回来时对不上号就是被顶掉的旧请求 */
  const ticketRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const runAsync = useEvent(async (...params: TParams) => {
    const ticket = (ticketRef.current += 1);

    setLoading(true);
    try {
      const result = await service(...params);

      if (ticket === ticketRef.current) {
        setData(result);
        onSuccess?.(result, params);
      }
      return result;
    } catch (error) {
      if (ticket === ticketRef.current) {
        onError?.(error, params);
      }
      throw error;
    } finally {
      // 被顶掉的请求不碰 loading: 它归最后那次请求管
      if (ticket === ticketRef.current) {
        setLoading(false);
      }
    }
  });

  /**
   * run 的落地动作. 它不返回 Promise, 调用方看不到这次失败, 所以异常在这里就地记一行.
   *
   * 不按"有没有 onError"来决定记不记: onError 是通知通道而不是日志, 且被后发请求顶掉的那次
   * 压根不走 onError —— 只看 onError 会让它失败得无声无息.
   */
  const fireAndForget = useEvent((...params: TParams) => {
    runAsync(...params).catch((error: unknown) => console.error(error));
  });

  const run = useEvent((...params: TParams) => {
    if (!debounceWait) {
      fireAndForget(...params);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fireAndForget(...params), debounceWait);
  });

  useEffect(() => {
    // 卸载后请求没有落点, 还挂着的防抖定时器只会白发一次
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    // 自动请求只在挂载时打一次, 且不带参; 要带参就用 manual + run / runAsync 自己发
    if (!manual) {
      fireAndForget(...([] as unknown as TParams));
    }
  }, []);

  return { data, loading, run, runAsync };
}
