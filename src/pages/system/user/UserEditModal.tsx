import type { BaseFormData } from '#/form';
import type { ModalControl } from '@south/components';
import { Result, message } from 'antd';
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
  const [loadError, setLoadError] = useState('');

  const { form, handleFinish, modalProps } = useModalForm<object, boolean>(props, {
    onSubmit: async (raw) => {
      // BaseForm 的 form 是 FormInstance<object>, 泛型不变性下只能按 object 取, 值在此收窄
      const values = raw as BaseFormData;
      await (id ? updateUser(id, values) : createUser(values));
      messageApi.success($t('public.successfulOperation'));
      return true;
    },
  });

  // 编辑时打开即拉详情, 期间内容区转圈
  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setData(await getUserById(id));
      } catch {
        // 详情拉不到就不能编辑: 空表单提交会把已有数据抹成空
        setLoadError($t('public.loadDetailFailed'));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  return (
    <BaseModal
      {...modalProps}
      okButtonProps={{ disabled: !!loadError }}
      title={id ? EDIT_TITLE(id) : ADD_TITLE()}
      isLoading={isLoading}
    >
      {contextHolder}
      {loadError && <Result status="error" title={loadError} />}
      {!loadError && (
        <BaseForm
          form={form}
          list={createList(!id)}
          data={data}
          labelCol={{ span: 4 }}
          handleFinish={handleFinish}
        />
      )}
    </BaseModal>
  );
}
