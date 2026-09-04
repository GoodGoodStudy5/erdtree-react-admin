import type { ButtonProps } from 'antd';
import { Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { $t } from '@/locales';

interface Props extends ButtonProps {
  isLoading?: boolean;
  btnType?: 'delete' | 'batchDelete';
  name?: string;
  customizeTitle?: string;
  isIcon?: boolean;
  handleDelete: () => void;
}

/** 删除按钮, 点击后二次确认. btnType 区分单条与批量, isIcon 切换为图标形态 */
export function DeleteBtn(props: Props) {
  const {
    isLoading,
    loading,
    isIcon,
    customizeTitle,
    name,
    btnType = 'delete',
    handleDelete,
  } = props;

  // 清除自定义属性
  const params: Partial<Props> = { ...props };
  delete params.isIcon;
  delete params.isLoading;
  delete params.btnType;
  delete params.handleDelete;

  return (
    <Popconfirm
      title={$t('public.kindTips')}
      description={$t(
        btnType === 'delete' ? 'public.deleteConfirmMessage' : 'public.batchDeleteConfirmMessage',
        { name: name ? ` ${name} ` : '' },
      )}
      onConfirm={handleDelete}
    >
      <Button
        danger
        type="primary"
        {...params}
        icon={params?.icon || (isIcon && <DeleteOutlined />)}
        loading={!!isLoading || loading}
      >
        {customizeTitle || btnType === 'delete' ? $t('public.delete') : $t('public.batchDelete')}
      </Button>
    </Popconfirm>
  );
}
