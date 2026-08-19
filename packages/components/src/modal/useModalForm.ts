import type { FormInstance } from 'antd';
import { Form } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { ModalAbort } from './abort';

/**
 * form.submit() 之后等 onFinish 的上限.
 * 校验已在前一步过了, 正常情况下这一步几乎立即完成; 设上限只为杜绝一种死局 ——
 * 表单组件因故走了 onFinishFailed 时 onFinish 永不触发, 那样 loading 卡死且弹窗因 busy 再也关不掉.
 */
const SUBMIT_SETTLE_TIMEOUT = 10_000;
import type { ModalControl, UseModalFormOptions, UseModalFormResult } from './types';
import { useModalShell } from './useModalShell';

/**
 * 表单弹窗. 在外壳之上再接管 form 实例与校验时机.
 *
 * 做成 hook 而非组件, 因为组件必须自己渲染一层 <Form>, 那样就与自带 Form 的表单组件
 * (如项目里的 BaseForm) 互斥了 —— 实际迁移中三个弹窗里有两个用不上组件版.
 *
 * 一律走 validateFields → form.submit() → onFinish → onSubmit, 所以裸 antd Form
 * 与自带 Form 的组件写法完全一致: 前者把 handleFinish 接到 onFinish, 后者接到它自己的提交回调.
 */
export function useModalForm<V, R>(
  control: ModalControl<R>,
  options: UseModalFormOptions<V, R>,
): UseModalFormResult<V> {
  const [form] = Form.useForm<V>();
  const pending = useRef<{ resolve: (value: R) => void; reject: (error: unknown) => void } | null>(
    null,
  );
  const { onSubmit, onError } = options;
  const submitRef = useRef<() => void>(() => undefined);

  const handleFinish = useCallback(
    (values: V) => {
      const task = pending.current;
      pending.current = null;
      if (!task) {
        // 表单内回车会直接触发 onFinish, 此时还没有等待中的提交.
        // 转交外壳走完整流程, 否则这一次提交会被无声丢弃
        submitRef.current();
        return;
      }
      void (async () => {
        try {
          task.resolve(await onSubmit(values));
        } catch (error) {
          task.reject(error);
        }
      })();
    },
    [onSubmit],
  );

  const onOk = useCallback(async () => {
    try {
      // 先自行校验: 不过就地中止, 否则表单组件多半只 console.warn, 提交态会一直挂着
      await form.validateFields();
    } catch {
      throw new ModalAbort('form validation failed');
    }

    // 再走一趟 form.submit(), 才能拿到表单组件自己处理过的值(如 dayjs 转字符串)
    return new Promise<R>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.current = null;
        reject(new Error('form submit did not settle: onFinish was never called'));
      }, SUBMIT_SETTLE_TIMEOUT);

      pending.current = {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
      form.submit();
    });
  }, [form]);

  const shell = useModalShell(control, { onOk, onError });

  // 渲染期不能写 ref, 放到提交后同步
  useEffect(() => {
    submitRef.current = shell.submit;
  });

  return { form: form as FormInstance<V>, handleFinish, ...shell };
}
