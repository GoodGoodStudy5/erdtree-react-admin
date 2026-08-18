import type { ButtonProps } from 'antd';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface Props extends ButtonProps {
  isLoading?: boolean;
}

/** 保存按钮, 文案随界面语言切换 */
export function UpdateBtn(props: Props) {
  const { isLoading, loading, className } = props;
  const { t } = useTranslation();

  // 清除自定义属性
  const params: Partial<Props> = { ...props };
  delete params.isLoading;

  return (
    <Button
      type="primary"
      {...params}
      className={`${className} small-btn`}
      loading={!!isLoading || loading}
    >
      {t('public.edit')}
    </Button>
  );
}
