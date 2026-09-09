import type { ReactNode } from 'react';

/**
 * 重渲边界: 订阅关在这一层, 内容从 `children` 原样穿过 —— 引用恒定的 element 被 React 直接复用,
 * 订阅值变化时内容组件的函数体一次不进.
 * @param props - 组件参数
 */
export function WatchData<T>(props: {
  /** 订阅什么. 必须是具名的 `useXxx` 函数表达式, 匿名箭头会被 `react-hooks/rules-of-hooks` 误报 */
  use: () => T;
  /** 拿订阅结果画外壳. 内容只能用第二个形参, 在这里创建就白包, 且没有任何信号 */
  render: (data: T, children: ReactNode) => ReactNode;
  /** 穿过去的内容. 由调用点创建, 不进 `render` */
  children?: ReactNode;
}) {
  const { use, render, children } = props;

  return render(use(), children);
}
