import type { BaseFormData } from '#/form';
import type { ModalControl } from '@south/components';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { BaseModal, useModalForm } from '@south/components';
import { BaseForm } from '@/components';
import { createUser, getUserById, updateUser } from '@/servers';
import { $t } from '@/locales';
import { createList } from './model';

/** 新增时的默认值 */
const INIT_DATA: BaseFormData = { status: 1 };

interface Props extends ModalControl<boolean> {
  /** 有值为编辑, 无值为新增 */
  id?: string;
}

/** 用户新增与编辑. 提交成功交付 true, 由调用方决定要不要刷新列表 */
export function UserEditModal(props: Props) {
  const { id } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<BaseFormData>(INIT_DATA);
  const [isLoading, setLoading] = useState(false);

  const { form, handleFinish, modalProps } = useModalForm<object, boolean>(props, {
    onSubmit: async (raw) => {
      // BaseForm 的 form 是 FormInstance<object>, 泛型不变性下只能按 object 取, 值在此收窄
      const values = raw as BaseFormData;
      const { code, message: messageInfo } = await (id
        ? updateUser(id, values)
        : createUser(values));
      // 请求层已弹过错误提示, 这里抛出只为让弹窗停在原地
      if (Number(code) !== 200) throw new Error(messageInfo || 'submit failed');
      messageApi.success(messageInfo || $t('public.successfulOperation'));
      return true;
    },
  });

  // 编辑时打开即拉详情, 期间内容区转圈
  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const { code, data: detail } = await getUserById(id);
        if (Number(code) !== 200) return;
        setData(detail);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  return (
    <BaseModal {...modalProps} title={id ? EDIT_TITLE(id) : ADD_TITLE()} isLoading={isLoading}>
      {contextHolder}
      <BaseForm
        form={form}
        list={createList(!id)}
        data={data}
        labelCol={{ span: 4 }}
        handleFinish={handleFinish}
      />
    </BaseModal>
  );
}
