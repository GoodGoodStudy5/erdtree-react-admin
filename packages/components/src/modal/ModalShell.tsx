import { BaseModal } from './BaseModal';
import { useModalInstance } from './instance';
import type { ModalShellProps } from './types';
import { useModalShell } from './useModalShell';

/**
 * 命令式弹窗的外壳. 吃掉 open / onCancel / confirmLoading / 显式 resolve 四样样板,
 * 业务组件只需给出 onOk.
 *
 * control 必须显式传进来, 这是 R 从弹窗组件 props 连通到 onOk 返回值的唯一通路.
 */
export function ModalShell<R>(props: ModalShellProps<R>) {
  const { control, onOk, onError, children, afterClose, ...rest } = props;
  const shell = useModalShell(control, { onOk, onError });
  const instance = useModalInstance();

  return (
    <BaseModal
      {...rest}
      {...shell.modalProps}
      afterClose={() => {
        afterClose?.();
        // 退场动画放完了, 提前于兜底计时移除实例
        instance?.notifyClosed();
      }}
    >
      {children}
    </BaseModal>
  );
}
