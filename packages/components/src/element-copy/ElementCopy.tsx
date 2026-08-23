import type { ComponentProps, ReactNode } from 'react';
import { useRef } from 'react';
import { Typography } from 'antd';
import { useEvent } from '../hooks';
import { propsMerge } from '../utils';
import './ElementCopy.less';

/** antd 没把 CopyConfig 摆上包门面, 从 Paragraph 的 props 反推, 免得深引它的内部路径 */
type CopyConfig = Exclude<
  ComponentProps<typeof Typography.Paragraph>['copyable'],
  boolean | undefined
>;

export interface ElementCopyProps {
  /** 要展示也要被复制的内容. 任意 JSX, 复制载荷由它渲染出来的文本决定 */
  children: ReactNode;
  className?: string;
  /**
   * 覆盖或扩展 antd 的复制配置 (图标 / tooltip / 已复制态都由它供给).
   *
   * `text` 给了就以它为准, 于是"复制什么"这条口径始终留着覆盖口: 需要含隐藏元素之类的
   * 特殊取值时不必 fork 组件.
   */
  copyProps?: CopyConfig;
}

/**
 * 包住任意 JSX, 复制到手的就是用户眼睛看到的多行文本 (含换行).
 *
 * 复制口径 = 渲染出来的 DOM 文本 —— 这是产品语义而不是实现细节: 调用方只维护一份 JSX,
 * 不必为"复制版"再拼一份纯文本, 于是两者永远不会不一致.
 *
 * 图标、tooltip、已复制态借 Typography.Paragraph 的 copyable 白拿, 组件只接管"复制什么".
 * 核心能力落在 `copyable.text` 上而不是 onCopy 上, 所以外部传自己的 onCopy 也杀不掉复制,
 * 它只是多一个通知点.
 */
export function ElementCopy({ children, className, copyProps }: ElementCopyProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  // 只在点复制时被调用, 渲染期不读 ref
  const readVisibleText = useEvent(() => contentRef.current?.innerText ?? '');
  const copyable = propsMerge({ text: readVisibleText }, copyProps);

  return (
    <Typography.Paragraph
      className={className ? `element-copy ${className}` : 'element-copy'}
      copyable={copyable}
    >
      <div className="element-copy-content" ref={contentRef}>
        {children}
      </div>
    </Typography.Paragraph>
  );
}
