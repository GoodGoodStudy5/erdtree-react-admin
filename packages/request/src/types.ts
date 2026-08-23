import type { AxiosResponse, InternalAxiosRequestConfig, CreateAxiosDefaults, Cancel } from 'axios';

/** 拦截器拿到的错误形状: axios 的取消对象加上后端返回的响应体 */
export interface RequestCancel extends Cancel {
  data: object;
  response: {
    status: number;
    data: {
      code?: number;
      message?: string;
    };
  };
}

/** 建实例时可挂的拦截器. 请求与响应各一对 (正常与异常) */
export interface RequestInterceptors<T> {
  // 请求拦截
  requestInterceptors?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  requestInterceptorsCatch?: (err: RequestCancel) => void;
  // 响应拦截
  responseInterceptors?: (config: T) => T;
  responseInterceptorsCatch?: (err: RequestCancel) => void;
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
