import axios from 'axios';
import type {
  AxiosResponse,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
} from 'axios';
import type { BlobDownload, RequestInterceptors, CreateRequestConfig } from './types';

interface NewAxiosRequestConfig extends AxiosRequestConfig {
  _abortController?: AbortController;
}

class AxiosRequest {
  // axios 实例
  instance: AxiosInstance;
  // 拦截器对象
  interceptorsObj?: RequestInterceptors<AxiosResponse>;
  /** 在飞请求的控制器, 值是请求地址. 只服务 cancelRequest / cancelAllRequest 的清场 */
  abortControllerMap: Map<AbortController, string>;

  constructor(config: CreateRequestConfig) {
    this.instance = axios.create(config);
    // 初始化存放取消请求控制器Map
    this.abortControllerMap = new Map();
    this.interceptorsObj = config.interceptors;
    // 拦截器执行顺序 接口请求 -> 实例请求 -> 全局请求 -> 实例响应 -> 全局响应 -> 接口响应
    this.instance.interceptors.request.use(
      (res: InternalAxiosRequestConfig) => {
        const controller = new AbortController();

        res.signal = controller.signal;
        (res as NewAxiosRequestConfig)._abortController = controller;
        this.abortControllerMap.set(controller, res.url ?? '');

        return res;
      },
      (err: object) => Promise.reject(err),
    );

    // 使用实例拦截器
    this.instance.interceptors.request.use(
      this.interceptorsObj?.requestInterceptors,
      this.interceptorsObj?.requestInterceptorsCatch,
    );
    // 清场排在业务拦截器之前: 业务拦截器抛出的错误不带 config, 放在它之后就漏登记
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        this.forget(res.config as NewAxiosRequestConfig);
        return res;
      },
      (err: { config?: NewAxiosRequestConfig }) => {
        this.forget(err?.config);
        return Promise.reject(err);
      },
    );
    this.instance.interceptors.response.use(
      this.interceptorsObj?.responseInterceptors,
      this.interceptorsObj?.responseInterceptorsCatch,
    );
    // 全局响应拦截器保证最后执行
    this.instance.interceptors.response.use(
      // blob 要带头, 不能剥成 data; 其余信封已由实例拦截器剥掉
      (res: AxiosResponse) => (res.config.responseType === 'blob' ? res : res.data),
      (err: object) => Promise.reject(err),
    );
  }

  /**
   * 请求落地后销掉登记, 成功与失败同办
   * @param config - 请求配置, 发起时在上面挂了控制器
   */
  private forget(config?: NewAxiosRequestConfig) {
    const controller = config?._abortController;
    if (controller) this.abortControllerMap.delete(controller);
  }
  /**
   * 取消全部请求
   */
  cancelAllRequest() {
    for (const controller of this.abortControllerMap.keys()) {
      controller.abort();
    }
    this.abortControllerMap.clear();
  }
  /**
   * 取消指定的请求
   * @param url - 待取消的请求URL
   */
  cancelRequest(url: string | string[]) {
    const urlList = Array.isArray(url) ? url : [url];
    for (const [controller, requestUrl] of this.abortControllerMap) {
      if (!urlList.includes(requestUrl)) continue;
      controller.abort();
      this.abortControllerMap.delete(controller);
    }
  }
  /**
   * get请求
   * @param url - 链接
   * @param options - 参数
   */
  get<T = object>(url: string, options = {}) {
    return this.instance.get(url, options) as Promise<T>;
  }
  /**
   * post请求
   * @param url - 链接
   * @param options - 参数
   */
  post<T = object>(url: string, options = {}, config?: AxiosRequestConfig<object>) {
    return this.instance.post(url, options, config) as Promise<T>;
  }
  /**
   * put请求
   * @param url - 链接
   * @param options - 参数
   */
  put<T = object>(url: string, options = {}, config?: AxiosRequestConfig<object>) {
    return this.instance.put(url, options, config) as Promise<T>;
  }
  /**
   * patch请求
   * @param url - 链接
   * @param options - 参数
   */
  patch<T = object>(url: string, options = {}, config?: AxiosRequestConfig<object>) {
    return this.instance.patch(url, options, config) as Promise<T>;
  }
  /**
   * delete请求
   * @param url - 链接
   * @param options - 参数
   */
  delete<T = object>(url: string, options = {}) {
    return this.instance.delete(url, options) as Promise<T>;
  }

  /**
   * 取回字节, 不剥信封. 另存名与追踪号从响应头取, 没有就不给.
   */
  async blob(url: string, config: AxiosRequestConfig = {}): Promise<BlobDownload> {
    const res = (await this.instance.request({
      ...config,
      url,
      responseType: 'blob',
    })) as AxiosResponse<Blob>;
    return {
      blob: res.data,
      fileName: savedNameOf(res.headers),
      traceId: headerOf(res.headers, 'x-trace-id'),
    };
  }

  /**
   * SSE请求
   * @param url - 链接
   * @param onMessage - 接收数据回调函数
   * @param onError - 错误回调函数
   * @param options - 参数
   */
  sse<T = unknown>({
    url,
    onMessage,
    onError,
    options = {},
  }: {
    url: string;
    onMessage: (data: T) => void;
    onError?: (error: Event) => void;
    options?: AxiosRequestConfig;
  }): () => void {
    // 检查是否需要使用 fetch 实现 SSE（例如 POST 请求）
    const method = options.method?.toUpperCase() || 'GET';
    const isGetRequest = method === 'GET';

    // 获取 token
    let tokenLocal = '';
    try {
      const config = this.interceptorsObj?.requestInterceptors?.({
        headers: {},
      } as InternalAxiosRequestConfig);
      if (config?.headers?.Authorization) {
        tokenLocal = String(config.headers.Authorization).replace('Bearer ', '');
      }
    } catch (error) {
      console.warn('获取 token 失败:', error);
    }

    if (isGetRequest) {
      // 使用原生 EventSource 处理 GET 请求
      const fullUrl = this.instance.getUri({ url, ...options });

      // EventSource 不直接支持自定义 headers，需要通过其他方式传递 token
      // 可以通过 URL 参数或者后端支持的其他方式
      const urlWithToken = tokenLocal
        ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}token=${tokenLocal}`
        : fullUrl;

      const source = new EventSource(urlWithToken, { withCredentials: true });

      source.onmessage = (event) => {
        try {
          const data: T = JSON.parse(event.data);
          onMessage(data);
        } catch {
          // 忽略解析错误，直接传递原始数据
          onMessage(event.data as unknown as T);
        }
      };

      source.onerror = (error) => {
        if (onError) {
          onError(error);
        } else {
          console.error('SSE连接错误:', error);
        }
        // 出错时关闭连接
        source.close();
      };

      // 返回关闭连接的函数
      return () => {
        source.close();
      };
    }
    // 使用 fetch 处理非 GET 请求（如 POST）
    let isCanceled = false;
    const abortController = new AbortController();

    const createSSEConnection = async () => {
      try {
        const config: RequestInit = {
          method,
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
          } as Record<string, string>,
        };

        // 添加认证头
        if (tokenLocal) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${tokenLocal}`,
          };
        }

        // 添加请求体
        if (options.data) {
          config.body = JSON.stringify(options.data);
        }

        // 构建完整 URL
        const fullUrl = this.instance.getUri({ url, ...options });

        const response = await fetch(fullUrl, config);

        if (!response.ok) {
          throw new Error(`SSE请求错误: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('SSE请求没有响应体');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!isCanceled) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // 处理接收到的数据（按行分割）
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留不完整的行

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6); // 移除 'data: ' 前缀
              // eslint-disable-next-line max-depth
              try {
                const data: T = JSON.parse(dataStr);
                onMessage(data);
              } catch {
                // 如果不是 JSON 格式，直接传递原始数据
                onMessage(dataStr as unknown as T);
              }
            }
          }
        }

        reader.releaseLock();
      } catch (error) {
        if (!isCanceled) {
          if (onError) {
            onError(error as Event);
          } else {
            console.error('SSE连接错误:', error);
          }
        }
      }
    };

    // 启动连接
    createSSEConnection();

    // 返回关闭连接的函数
    return () => {
      isCanceled = true;
      abortController.abort();
    };
  }
}

/** Content-Disposition 的 filename*, 没有这一格就不给 */
function savedNameOf(headers: AxiosResponse['headers']): string | undefined {
  const raw = headerOf(headers, 'content-disposition');
  if (!raw) return undefined;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(raw);
  if (!star) return undefined;
  try {
    return decodeURIComponent(star[1]);
  } catch {
    return star[1];
  }
}

function headerOf(headers: AxiosResponse['headers'] | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const value =
    typeof headers.get === 'function'
      ? headers.get(name)
      : (headers as Record<string, unknown>)[name];
  return typeof value === 'string' && value ? value : undefined;
}

/** axios 实例的封装类. 拦截器、取消与统一错误处理都在它身上 */
export default AxiosRequest;
