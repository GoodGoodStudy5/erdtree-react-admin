import type { FormInstance } from 'antd';
import { Form } from 'antd';
import { ModalAbort } from './abort';
import type { ModalControl, UseModalFormOptions, UseModalFormResult } from './types';
import { useEvent } from '../hooks';
import { useModalShell } from './useModalShell';

/**
 * 表单弹窗. 在外壳之上再接管 form 实例与校验时机.
 *
 * 做成 hook 而非组件, 因为组件必须自己渲染一层 <Form>, 那样就与自带 Form 的表单组件
 * (如项目里的 BaseForm) 互斥了 —— 实际迁移中三个弹窗里有两个用不上组件版.
 *
 * 点确定: validateFields 过了就把值交给 onSubmit. 调用方不必接 Form 的提交回调.
 */
export function useModalForm<V, R>(
  control: ModalControl<R>,
  options: UseModalFormOptions<V, R>,
): UseModalFormResult<V> {
  const [form] = Form.useForm<V>();
  const { onSubmit, onError } = options;

  const onOk = useEvent(async () => {
    let values: V;
    try {
      values = await form.validateFields();
    } catch (err) {
      console.error('form validation failed: ', err);
      throw new ModalAbort('form validation failed');
    }
    return onSubmit(values);
  });

  const shell = useModalShell(control, { onOk, onError });

  return { form: form as FormInstance<V>, ...shell };
}
