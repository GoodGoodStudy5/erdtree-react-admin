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
      async responseInterceptors(res) {
        const data = res.data as (ServerResult & { detail?: string }) | Blob;
        const json = await jsonResultOf(data);
        const envelope = json ?? (!(data instanceof Blob) ? data : undefined);

        // 权限过期
        if (envelope?.code === 401) {
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
          console.error('错误信息:', envelope?.message || msg);

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

        // blob: JSON 信封走与普通接口同一套失败分支; 其余交给调用方按 Content-Type 落盘
        if (data instanceof Blob || res.config?.responseType === 'blob') {
          if (json && json.code !== 200) {
            handleError(json.message);
            throw new RequestError(json.code ?? 0, json.message ?? '请求失败');
          }
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
      async responseInterceptorsCatch(err) {
        // 清场时会 abort 在飞请求: 取消不是失败, 不提示
        if (axios.isCancel(err)) return Promise.reject(err);
        // 成功拦截器已判过的业务拒绝, 不再盖成「服务器错误」
        if (err instanceof RequestError) return Promise.reject(err);

        const { status, data } = (err as RequestCancel)?.response ?? {};
        const json = await jsonResultOf(data);
        const text = json?.message || messageOf(data);

        if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
          handleError('请求超时！');
          return Promise.reject(new RequestError(status ?? 0, '请求超时！'));
        }

        const msg = text || '服务器错误！';
        handleError(msg);
        return Promise.reject(new RequestError(status ?? 0, msg));
      },
    },
  });
}

/** Blob.type 是 JSON 时读成 ServerResult; 读不出就当不是信封 */
async function jsonResultOf(data: unknown): Promise<ServerResult | undefined> {
  if (!(data instanceof Blob) || !data.type.startsWith('application/json')) return undefined;
  try {
    const parsed: unknown = JSON.parse(await data.text());
    return isEnvelope(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isEnvelope(value: unknown): value is ServerResult {
  return Boolean(value && typeof value === 'object' && 'code' in value);
}

function messageOf(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || !('message' in value)) return undefined;
  const text = (value as { message?: unknown }).message;
  return typeof text === 'string' && text ? text : undefined;
}

/**
 * 异常处理
 * @param error - 错误信息
 * @param content - 自定义内容
 */
const handleError = (error?: string, content?: string) => {
  console.error('错误信息:', error);
  message.error({
    content: content || error || '服务器错误',
    key: 'error',
  });
};

export { creteRequest, LOGIN_EXPIRED_MSG };
export { RequestError } from './requestError';
// 后端信封与拦截器内部的错误形状不外泄, 调用方拿到的是剥好的业务数据
export type {
  BlobDownload,
  CreateRequestConfig,
  CreateRequestOptions,
  RequestInterceptors,
} from './types';
