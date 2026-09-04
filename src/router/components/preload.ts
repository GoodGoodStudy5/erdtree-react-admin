import type { RouteModules } from '../utils/helper';
import { useEffect } from 'react';

// 测试文件与页面同目录, 不排除会一并进产物并被预热
const pages = import.meta.glob(['../../pages/**/*.tsx', '!**/__tests__/**'], {
  eager: false,
}) as RouteModules;

// 预加载组件
const components = import.meta.glob(['../../../components/**/*.tsx', '!**/__tests__/**'], {
  eager: false,
}) as RouteModules;

// 预加载的路由集合
const preloadedRoutes = new Set<string>();
// 预加载的组件集合
const preloadedComponents = new Set<string>();

/**
 * 每轮空闲期最多发起的预热请求数.
 *
 * <p>不限流会把百来个请求一次性压在首屏之后 —— requestIdleCallback 只管何时开始, 不管发多少.
 * 这些请求与首屏尚未完成的资源抢带宽和连接, 预热反而拖慢了本该先到的东西.
 */
const PRELOAD_BATCH_SIZE = 4;

/**
 * 空闲时分批预热模块, 避免首次进入页面才发起请求.
 *
 * @param modules - 模块表
 * @param preloaded - 已预热路径, 防止重复请求
 * @param label - 失败日志前缀
 * @returns 取消函数, 组件卸载时中止后续批次
 */
function preloadModules(modules: RouteModules, preloaded: Set<string>, label: string) {
  const pending = Object.keys(modules).filter((path) => !preloaded.has(path));
  let handle = 0;

  const loadBatch = (deadline: IdleDeadline) => {
    let count = 0;
    while (pending.length > 0 && count < PRELOAD_BATCH_SIZE && deadline.timeRemaining() > 0) {
      const path = pending.shift() as string;
      preloaded.add(path);
      modules[path]().catch(() => {
        console.error(`${label}错误：`, path);
      });
      count += 1;
    }

    if (pending.length > 0) handle = requestIdleCallback(loadBatch);
  };

  handle = requestIdleCallback(loadBatch);
  return () => cancelIdleCallback(handle);
}

/** 空闲时预热页面与组件, 让首次进入页面不必等模块下载 */
export const usePreloadModules = () => {
  // 预加载路由和组件，在空闲时间加载
  useEffect(() => {
    // 使用 requestIdleCallback 在浏览器空闲时预加载
    if (!('requestIdleCallback' in window)) return;

    const cancelRoutes = preloadModules(pages, preloadedRoutes, '预加载路由');
    const cancelComponents = preloadModules(components, preloadedComponents, '预加载组件');

    return () => {
      cancelRoutes();
      cancelComponents();
    };
  }, []);
};
