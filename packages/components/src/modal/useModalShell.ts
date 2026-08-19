import { useCallback, useMemo, useState } from 'react';
import { isModalAbort } from './abort';
import { useModalInstance } from './instance';
import type { UseModalShellFn } from './types';

/**
 * 把控制面接成可直接用的一组东西.
 *
 * 控制面走参数而非 context —— R 声明在弹窗组件自己的 props 上, 隔着组件边界,
 * 只有把它当实参传进来类型才连得通. 走 context 的话 onOk 返回错类型编译器不会报.
 *
 * 产出既有中性原语也有 modalProps: 后者只给 antd Modal 系载体整包展开,
 * 因为 JSX 展开不做多余属性检查, 展开到 Drawer 上 onCancel 会被静默忽略且不报错.
 */
export const useModalShell: UseModalShellFn = (control, options) => {
  const instance = useModalInstance();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { onOk, onError } = options;
  const { resolve, cancel } = control;

  const submit = useCallback(() => {
    void (async () => {
      setConfirmLoading(true);
      instance?.setBusy(true);
      try {
        resolve(await onOk());
      } catch (error) {
        // 提交失败不关弹窗, 用户可以改了重提交
        // 中止不是异常(校验未过之类), 停在原地即可, 不上报
        if (isModalAbort(error)) return;
        if (onError) onError(error);
        // 没人接管就重抛 —— 空 catch 与只打日志都是吞异常
        else throw error;
      } finally {
        setConfirmLoading(false);
        instance?.setBusy(false);
      }
    })();
  }, [instance, onError, onOk, resolve]);

  const close = useCallback(() => {
    // 有实例就走 requestClose, 它会过关闭拦截、并在提交中拒绝关闭
    if (instance) instance.requestClose();
    else cancel();
  }, [cancel, instance]);

  const modalProps = useMemo(
    () => ({
      open: instance ? instance.visible : true,
      confirmLoading,
      onOk: submit,
      onCancel: close,
      // 提交中禁止关闭: antd 的 confirmLoading 只管确定按钮, 这三样得自己接管
      cancelButtonProps: confirmLoading ? { disabled: true } : undefined,
      maskClosable: confirmLoading ? false : undefined,
      keyboard: confirmLoading ? false : undefined,
    }),
    [close, confirmLoading, instance, submit],
  );

  return { confirmLoading, submit, close, modalProps };
};
