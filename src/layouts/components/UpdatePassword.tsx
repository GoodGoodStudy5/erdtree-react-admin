import type { ModalControl } from '@south/components';
import { Form } from 'antd';
import { BaseModal, ModalAbort, useModalForm } from '@south/components';
import { message } from '@south/message';
import { updatePassword } from '@/servers';
import { PASSWORD_RULE } from '@/utils';
import { PasswordStrength } from '@/components';
import { $t } from '@/locales';

interface FormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 修改密码.
 * 只负责改密码本身, 改完是否登出由调用方决定 —— 弹窗不该替应用决定全局登录状态.
 */
export function UpdatePassword(props: ModalControl<boolean>) {
  /** 提交修改 */
  const onSubmit = async (values: FormValues) => {
    // 两次输入不一致是用户笔误, 提示后停在原地, 不算异常
    if (values.newPassword !== values.confirmPassword) {
      message.warning({
        content: $t('login.confirmPasswordMessage'),
        key: 'confirmPassword',
      });
      throw new ModalAbort('confirm password mismatch');
    }

    const { code, message: messageInfo } = await updatePassword(values);
    // 请求层已经弹过错误提示, 这里抛出只为让弹窗停在原地
    if (Number(code) !== 200) throw new Error(messageInfo || 'update password failed');

    message.success(messageInfo);
    return true;
  };

  const { form, handleFinish, modalProps } = useModalForm<FormValues, boolean>(props, {
    onSubmit,
  });

  return (
    <BaseModal {...modalProps} title={$t('public.changePassword')}>
      <Form form={form} onFinish={handleFinish} labelWrap autoComplete="off">
        <Form.Item
          label={$t('login.oldPassword')}
          name="oldPassword"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 19 }}
          rules={[
            { required: true, message: $t('public.pleaseEnter', { name: $t('login.password') }) },
            PASSWORD_RULE(),
          ]}
        >
          <PasswordStrength />
        </Form.Item>
        <Form.Item
          label={$t('login.newPassword')}
          name="newPassword"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 19 }}
          rules={[
            { required: true, message: $t('public.pleaseEnter', { name: $t('login.password') }) },
            PASSWORD_RULE(),
          ]}
        >
          <PasswordStrength />
        </Form.Item>
        <Form.Item
          label={$t('login.confirmPassword')}
          name="confirmPassword"
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 19 }}
          rules={[
            {
              required: true,
              message: $t('public.pleaseEnter', { name: $t('login.confirmPassword') }),
            },
            PASSWORD_RULE(),
          ]}
        >
          <PasswordStrength />
        </Form.Item>
      </Form>
    </BaseModal>
  );
}
