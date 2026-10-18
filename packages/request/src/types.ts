import type { AxiosResponse, InternalAxiosRequestConfig, CreateAxiosDefaults, Cancel } from 'axios';

/** 拦截器拿到的错误形状: axios 的取消对象加上后端返回的响应体 */
export interface RequestCancel extends Cancel {
  response: {
    status: number;
    /** 普通接口是信封对象; responseType blob 时是 Blob */
    data?: unknown;
  };
}

/** 建实例时可挂的拦截器. 请求与响应各一对 (正常与异常) */
export interface RequestInterceptors<T> {
  // 请求拦截
  requestInterceptors?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  requestInterceptorsCatch?: (err: RequestCancel) => unknown;
  // 响应拦截. 读 JSON blob 要 await, 因此允许 Promise
  responseInterceptors?: (config: T) => T | Promise<T>;
  responseInterceptorsCatch?: (err: RequestCancel) => unknown;
}

/** 自定义传入的参数: axios 原生配置外加本包的拦截器 */
export interface CreateRequestConfig<T = AxiosResponse> extends CreateAxiosDefaults {
  interceptors?: RequestInterceptors<T>;
}

/** creteRequest 扩展选项: axios 之外、要由应用层注入的行为 */
export interface CreateRequestOptions {
  /**
   * 权限过期（响应 code 401）时的处理回调
   * 由应用层注入，与具体路由模式（HashRouter / BrowserRouter）解耦
   */
  onAuthExpired?: () => void;
}

/** 接口响应数据: 后端统一包了一层 code / message, 业务数据在 data */
export interface ServerResult<T = unknown> {
  code: number;
  message?: string;
  data: T;
}

/** `request.blob` 取回的字节. 另存名与追踪号来自响应头, 没有就不给 */
export interface BlobDownload {
  /** 响应体 */
  blob: Blob;
  /** Content-Disposition 的 filename*, 没有则空 */
  fileName?: string;
  /** X-Trace-Id, 没有则空 */
  traceId?: string;
}
