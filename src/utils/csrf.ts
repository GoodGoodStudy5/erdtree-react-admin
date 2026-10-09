import type { InternalAxiosRequestConfig } from 'axios';

/** 原生 form POST 与 axios 共用这一颗, 改名只动这里 */
export const CSRF_COOKIE = 'XSRF-TOKEN';
/** 回传 CSRF 令牌的请求头 */
const CSRF_HEADER = 'X-XSRF-TOKEN';
/** 需要回传 CSRF 令牌的方法, 只读请求不改状态因此不需要 */
const WRITE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/** 后端用的不是 Xor 版本的令牌处理器, 取到的值原样回传即可 */
export function readCookie(name: string): string {
  const prefix = `${name}=`;
  const target = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return target ? target.slice(prefix.length) : '';
}

/**
 * 给写入请求挂上 CSRF 令牌
 * @param config - 请求配置
 */
export function attachCsrfToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const method = config.method?.toLowerCase() ?? '';
  if (!WRITE_METHODS.has(method)) return config;

  const token = readCookie(CSRF_COOKIE);
  if (config?.headers && token) {
    config.headers[CSRF_HEADER] = token;
  }

  return config;
}
