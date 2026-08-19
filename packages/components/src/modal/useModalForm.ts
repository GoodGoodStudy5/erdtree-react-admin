import type { FormInstance } from 'antd';
import { Form } from 'antd';
import { useCallback, useRef } from 'react';
import { ModalAbort } from './abort';
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

  const handleFinish = useCallback(
    (values: V) => {
      const task = pending.current;
      pending.current = null;
      if (!task) return;
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

  const onOk = useCallback(() => {
    return new Promise<R>((resolve, reject) => {
      // 先自行校验: 不过就地中止, 否则表单组件多半只 console.warn, 提交态会一直挂着
      form
        .validateFields()
        .then(() => {
          pending.current = { resolve, reject };
          form.submit();
        })
        .catch(() => reject(new ModalAbort('form validation failed')));
    });
  }, [form]);

  const shell = useModalShell(control, { onOk, onError });

  return { form: form as FormInstance<V>, handleFinish, ...shell };
}
