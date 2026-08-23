import { TOKEN } from './config';
import { creteRequest } from '@south/request';
import { router } from '@/router';

// 生成环境所用的接口
const prefixUrl = import.meta.env.VITE_BASE_URL as string;
const baseURL = process.env.NODE_ENV !== 'development' ? prefixUrl : '/api';

/** 业务侧统一请求实例, 已内置令牌注入与权限过期跳转 */
export const request = creteRequest(baseURL, TOKEN, {
  // 令牌过期后回到登录页, 并记下此刻所在的页面, 重新登录后接着看
  onAuthExpired: () => {
    const { pathname, search } = router.location;
    const currentRoute = `${pathname}${search}`;
    const redirect = currentRoute && currentRoute !== '/login' ? `?redirect=${currentRoute}` : '';
    router.navigate(`/login${redirect}`);
  },
});

// 创建多个请求
// export const newRequest = creteRequest('/test', TOKEN);

/**
 * 取消请求
 * @param url - 链接
 */
export const cancelRequest = (url: string | string[]) => {
  return request.cancelRequest(url);
};

/** 取消全部请求 */
export const cancelAllRequest = () => {
  return request.cancelAllRequest();
};
