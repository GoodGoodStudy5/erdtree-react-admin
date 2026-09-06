/**
 * 请求失败: 业务码非成功码, 或 HTTP 层出错.
 *
 * 失败的反馈已由拦截器给出 —— 多数是弹提示, 401 是跳登录 —— 调用方 catch 到它只需决定
 * 后续动作 (关不关弹窗, 刷不刷列表), 不要再报一次.
 */
export class RequestError extends Error {
  /** 后端业务码; HTTP 层失败时是状态码, 连状态码都拿不到时为 0 */
  readonly code: number;

  /**
   * @param code - 业务码或 HTTP 状态码
   * @param message - 失败原因, 后端没给时由调用现场兜一句
   */
  constructor(code: number, message: string) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
  }
}
