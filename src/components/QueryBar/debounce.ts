/**
 * 前沿加尾部的防抖: 第一下立刻走, 窗口里的后续调用合成一次, 停手后再走一次.
 *
 * 不按控件类型分档 —— 下拉选一个与文本框敲一个字在这里是同一件事, 而前沿触发让前者零延迟,
 * 尾部触发让后者只在停手时结算. 分档要在搜索栏里认出每个控件是哪一类, 那是把控件表抄第二遍.
 *
 * **只调一次时只走前沿, 不补尾部**: 补了的话下拉选一次会提交两次.
 * @param fn - 到点要跑的动作. 每次都重新读当前值, 所以不收参数
 * @param wait - 合并窗口, 毫秒
 */
export function leadingDebounce(fn: () => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** 窗口里有没有被再次调用. 没有就说明前沿那一次已经是最终值, 尾部不必再走 */
  let repeated = false;

  const call = () => {
    if (timer === undefined) {
      fn();
    } else {
      repeated = true;
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = undefined;
      if (!repeated) return;
      repeated = false;
      fn();
    }, wait);
  };

  /** 卸载时清掉: 还挂着的定时器只会对着已经不在的表单白跑一次 */
  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
    repeated = false;
  };

  return { call, cancel };
}
