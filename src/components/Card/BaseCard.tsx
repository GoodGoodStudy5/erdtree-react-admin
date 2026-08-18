import { HTMLAttributes } from 'react';

/** 铺满容器的内容卡片, 内容超出时卡片内部滚动 */
export function BaseCard(props: HTMLAttributes<unknown>) {
  const { children, className } = props;

  return (
    <div
      {...props}
      id="card"
      className={`
        h-full
        box-border
        overflow-auto
        relative
        box-border
        px-5
        py-3
        rounded-3
        ${className}
      `}
    >
      {children}
    </div>
  );
}
