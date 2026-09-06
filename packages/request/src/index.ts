import type { CreateRequestOptions, RequestCancel, ServerResult } from './types';
import { message } from '@south/message';
import { getLocalInfo, removeLocalInfo } from '@south/utils';
import axios from 'axios';
import AxiosRequest from './request';
import { RequestError } from './requestError';

/**
 * 权限过期提示在 localStorage 中的存储 key
 * 请求拦截器在整页跳转前写入，登录页挂载后读取并清除
 */
const LOGIN_EXPIRED_MSG = 'login:expiredMsg';

/**
 * 创建请求
 * @param url - 链接地址
 * @param tokenKey - 存token的key值
 * @param options - 扩展选项（onAuthExpired 权限过期回调，由应用层注入）
 */
function creteRequest(url: string, tokenKey: string, options?: CreateRequestOptions) {
  return new AxiosRequest({
    baseURL: url,
    timeout: 180 * 1000,
    interceptors: {
      // 接口请求拦截
      requestInterceptors(res) {
        const tokenLocal = getLocalInfo(tokenKey) || '';
        if (res?.headers && tokenLocal) {
          res.headers.Authorization = `Bearer ${tokenLocal}` as string;
        }
        return res;
      },
      // 请求拦截超时
      requestInterceptorsCatch(err) {
        message.error('请求超时！');
        return Promise.reject(new RequestError(0, err?.message || '请求超时'));
      },
      // 接口响应拦截
      responseInterceptors(res) {
        const { data } = res;
        // 权限过期
        if (data?.code === 401) {
          const currentToken = getLocalInfo(tokenKey) || '';
          const requestToken = String(res.config.headers.get('Authorization') || '').replace(
            'Bearer ',
            '',
          );
          if (currentToken && requestToken !== currentToken) {
            throw new RequestError(401, '换会话前发出的请求, 结论不作数');
          }

          const lang = localStorage.getItem('lang');
          const enMsg = 'Insufficient permissions, please log in again!';
          const zhMsg = '权限过期，请重新登录！';
          const msg = lang === 'en' ? enMsg : zhMsg;
          removeLocalInfo(tokenKey);
          console.error('错误信息:', data?.message || msg);

          localStorage.setItem(LOGIN_EXPIRED_MSG, msg);

          if (options?.onAuthExpired) {
            options.onAuthExpired();
          } else {
            const current = `${window.location.pathname}${window.location.search}`;
            const redirect = current && current !== '/login' ? `?redirect=${current}` : '';
            window.location.href = `/login${redirect}`;
          }
          // 跳转已经是反馈, 不再弹提示
          throw new RequestError(401, msg);
        }

        // blob 响应（文件下载）跳过业务 code 校验，交由调用方处理（如 ExportModal 解析错误 blob）
        if (data instanceof Blob || res.config?.responseType === 'blob') {
          return res;
        }

        // 错误处理（FastAPI HTTPException 返回 {detail} 无 message/code，故兜底 detail）
        if (data?.code !== 200) {
          const msg = data?.message || data?.detail;
          handleError(msg);
          throw new RequestError(data?.code ?? 0, msg || '请求失败');
        }

        // 业务信封止步于本层: 调用方拿到的是 data 本身
        res.data = (data as ServerResult).data;
        return res;
      },
      responseInterceptorsCatch(err) {
        // 清场时会 abort 在飞请求: 取消不是失败, 不提示
        if (axios.isCancel(err)) return Promise.reject(err);

        const response = (err as RequestCancel)?.response;
        const msg = response?.data?.message || '服务器错误！';
        handleError(msg);
        return Promise.reject(new RequestError(response?.status ?? 0, msg));
      },
    },
  });
}

/**
 * 异常处理
 * @param error - 错误信息
 * @param content - 自定义内容
 */
const handleError = (error: string, content?: string) => {
  console.error('错误信息:', error);
  message.error({
    content: content || error || '服务器错误',
    key: 'error',
  });
};

export { creteRequest, LOGIN_EXPIRED_MSG };
export { RequestError } from './requestError';
// 后端信封与拦截器内部的错误形状不外泄, 调用方拿到的是剥好的业务数据
export type { CreateRequestConfig, CreateRequestOptions, RequestInterceptors } from './types';
