import type { ReactNode } from 'react';
import type { ButtonProps } from 'antd';
import { Button } from 'antd';

interface Props extends ButtonProps {
  isLoading?: boolean;
  children?: ReactNode;
}

/** 主色按钮, isLoading 与 antd 的 loading 任一为真即进入加载态 */
export function BaseBtn(props: Props) {
  const { isLoading, loading, children } = props;

  // 清除自定义属性
  const params: Partial<Props> = { ...props };
  delete params.isLoading;

  return (
    <Button type="primary" {...params} loading={!!isLoading || loading}>
      {children}
    </Button>
  );
}
