import type { RouteModules } from '../utils/helper';
import { useEffect } from 'react';

const pages = import.meta.glob('../../pages/**/*.tsx', { eager: false }) as RouteModules;

// 预加载组件
const components = import.meta.glob('../../../components/**/*.tsx', {
  eager: false,
}) as RouteModules;

// 预加载的路由集合
const preloadedRoutes = new Set<string>();
// 预加载的组件集合
const preloadedComponents = new Set<string>();

/**
 * 空闲时预热模块, 避免首次进入页面才发起请求
 * @param modules - 模块表
 * @param preloaded - 已预热路径, 防止重复请求
 * @param label - 失败日志前缀
 */
function preloadModules(modules: RouteModules, preloaded: Set<string>, label: string) {
  for (const path of Object.keys(modules)) {
    if (preloaded.has(path)) continue;
    preloaded.add(path);
    modules[path]().catch(() => {
      console.error(`${label}错误：`, path);
    });
  }
}

/** 空闲时预热页面与组件, 让首次进入页面不必等模块下载 */
export const usePreloadModules = () => {
  // 预加载路由和组件，在空闲时间加载
  useEffect(() => {
    // 使用 requestIdleCallback 在浏览器空闲时预加载
    if (!('requestIdleCallback' in window)) return;

    const idleCallbackId = requestIdleCallback(() => {
      preloadModules(pages, preloadedRoutes, '预加载路由');
      preloadModules(components, preloadedComponents, '预加载组件');
    });

    return () => cancelIdleCallback(idleCallbackId);
  }, []);
};
