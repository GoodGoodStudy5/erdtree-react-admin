import type { HTMLAttributes } from 'react';

/**
 * 内容卡片.
 *
 * 不带 overflow: 卡片没有定高, 那条 overflow 从不产生滚动, 却会让卡片里写了 data-sticky 的元素
 * 认它当滚动容器 —— 一个从不滚动的容器, 于是吸附永不触发.
 */
export function BaseCard(props: HTMLAttributes<unknown>) {
  const { children, className } = props;

  return (
    <div
      {...props}
      id="card"
      className={`
        h-full
        box-border
        relative
        box-border
        px-5
        py-3
        rounded-3
        bg-[var(--bg-container)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}
