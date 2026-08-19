import type { BaseFormData } from '#/form';
import type { ModalControl } from '@south/components';
import { Form, Result, message } from 'antd';
import { useEffect, useState } from 'react';
import { BaseModal, useModalForm } from '@south/components';
import { BaseForm } from '@/components';
import { createMenu, getMenuById, updateMenu } from '@/servers';
import { $t } from '@/locales';
import { createList } from './model';

/** 新增时的默认值 */
const INIT_DATA: BaseFormData = { state: 1, order: 0 };

interface Props extends ModalControl<boolean> {
  /** 有值为编辑, 无值为新增 */
  id?: string;
  /** 在某个菜单下新增时的父级 */
  parentId?: string;
  /** 在某个菜单下新增时的默认层级 */
  type?: number;
}

/** 菜单新增与编辑. 提交成功交付 true, 由调用方决定要不要刷新列表 */
export function MenuEditModal(props: Props) {
  const { id, parentId, type: initType } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<BaseFormData>({ ...INIT_DATA, parentId, type: initType });
  const [isLoading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const { form, handleFinish, modalProps } = useModalForm<object, boolean>(props, {
    onSubmit: async (raw) => {
      // BaseForm 的 form 是 FormInstance<object>, 泛型不变性下只能按 object 取, 值在此收窄
      const values = raw as BaseFormData;
      const { code, message: messageInfo } = await (id
        ? updateMenu(id, values)
        : createMenu(values));
      // 请求层已弹过错误提示, 这里抛出只为让弹窗停在原地
      if (Number(code) !== 200) throw new Error(messageInfo || 'submit failed');
      messageApi.success(messageInfo || $t('public.successfulOperation'));
      return true;
    },
  });

  // 表单项随菜单层级变化, 所以要盯住 type
  const watchedType = Form.useWatch<number | undefined>('type', form);

  // 编辑时打开即拉详情, 期间内容区转圈
  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const { code, data: detail, message: messageInfo } = await getMenuById(id);
        // 详情拉不到就不能编辑: 空表单提交会把已有数据抹成空
        if (Number(code) !== 200) {
          setLoadError(messageInfo || $t('public.loadDetailFailed'));
          return;
        }
        setData(detail);
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
      width={600}
      style={{ top: 20 }}
      title={id ? EDIT_TITLE(id) : ADD_TITLE()}
      isLoading={isLoading}
    >
      {contextHolder}
      {loadError && <Result status="error" title={loadError} />}
      {!loadError && (
        <BaseForm
          form={form}
          list={createList(id ?? '', watchedType)}
          data={data}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 19 }}
          handleFinish={handleFinish}
        />
      )}
    </BaseModal>
  );
}
