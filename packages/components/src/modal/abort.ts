/**
 * 中止提交, 但这不是异常.
 *
 * 表单校验未过、用户在二次确认里点了取消 —— 这些都该让弹窗停在原地,
 * 却不该被当成错误上报. 外壳收到它只复位 loading, 不走 onError 也不重抛.
 */
export class ModalAbort extends Error {
  constructor(reason = 'modal submit aborted') {
    super(reason);
    this.name = 'ModalAbort';
  }
}

/** 判断是否是中止而非异常 */
export function isModalAbort(error: unknown): error is ModalAbort {
  return error instanceof ModalAbort;
}
