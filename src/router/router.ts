import type { DataRouter } from 'react-router-dom';

/**
 * 承接跳转的路由实例.
 *
 * 本模块只持有实例, 不负责创建 —— 创建要拿到整张路由表, 那会让「想跳转的人」反过来认识每一个页面.
 * 实例在路由装配完成时登记进来, 于是任何模块跳转都不必背上页面的依赖.
 */
let instance: DataRouter | null = null;

/**
 * 登记承接跳转的路由实例, 全站只此一个.
 * @param dataRouter - 路由实例
 */
export const bindRouter = (dataRouter: DataRouter) => {
  instance = dataRouter;
};

/** 取用已登记的路由实例, 未登记时说清是时机问题而不是路径问题 */
function requireRouter(): DataRouter {
  if (!instance) {
    throw new Error('导航未就绪: 路由尚未装配完成, 此刻还不能跳转');
  }

  return instance;
}

/** 全局路由单例代理. 组件外要跳转就 import 这个调 router.navigate, 不要为了导航现造 hook */
export const router = {
  navigate: (...args: Parameters<DataRouter['navigate']>) => requireRouter().navigate(...args),
  /** 当前 SPA 路径, 与 hash/browser 路由模式无关 */
  get location() {
    return requireRouter().state.location;
  },
};
